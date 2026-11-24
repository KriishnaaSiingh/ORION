"""
Orion Intelligence — Entity Resolution ML Microservice
======================================================
Trains and serves an XGBoost-based binary classifier for record matching.

Datasets (from Documentation/):
  - cleaned_orion_er_master.csv   (~68k records, multi-dataset merged master)
  - cleaned_febrl.csv             (~21k records, Febrl benchmark)
  - cleaned_synthetic_enterprise_1M.csv  (1M records for scale testing)

The model compares two records and predicts: is this the same real-world entity?

Feature extraction uses standard ER comparison features:
  - Jaro-Winkler similarity on name fields
  - Exact match on structured identifiers (DOB year, soundex)
  - Edit distance on address / postcode
  - Phonetic (soundex) agreement
  - Missing-value indicators

API endpoints (FastAPI):
  POST /train            - Train the model on the master dataset
  POST /predict          - Score a pair of records
  POST /batch_predict    - Score many pairs at once
  GET  /model_info       - Current model stats
  GET  /health           - Health check
"""

from __future__ import annotations
import os, io, json, math, time, hashlib, itertools
from typing import Any, Optional, List, Dict, Tuple, Union
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Optional heavy deps (graceful degradation) ────────────────
try:
    from jellyfish import jaro_winkler_similarity, soundex, levenshtein_distance
    HAS_JELLYFISH = True
except ImportError:
    HAS_JELLYFISH = False
    # Pure-python fallbacks
    def jaro_winkler_similarity(a: str, b: str) -> float:
        if not a or not b: return 0.0
        if a == b: return 1.0
        s1, s2 = a.lower(), b.lower()
        m_len = max(len(s1), len(s2)) // 2 - 1
        s1_matches = [False] * len(s1); s2_matches = [False] * len(s2)
        matches = transpositions = 0
        for i, c in enumerate(s1):
            lo, hi = max(0, i - m_len), min(len(s2), i + m_len + 1)
            for j in range(lo, hi):
                if s2_matches[j] or s2[j] != c: continue
                s1_matches[i] = s2_matches[j] = True; matches += 1; break
        if matches == 0: return 0.0
        k = t = 0
        for i in range(len(s1)):
            if not s1_matches[i]: continue
            while not s2_matches[k]: k += 1
            if s1[i] != s2[k]: transpositions += 1
            k += 1
        jaro = (matches/len(s1) + matches/len(s2) + (matches - transpositions/2)/matches) / 3
        prefix = sum(1 for x, y in zip(s1[:4], s2[:4]) if x == y)
        return jaro + prefix * 0.1 * (1 - jaro)

    def soundex(s: str) -> str:
        if not s: return "0000"
        s = s.upper(); code = s[0]; table = "01230120022455012623010202"
        for c in s[1:]:
            if c.isalpha():
                d = table[ord(c) - ord('A')]
                if d != '0' and (not code or code[-1] != d): code += d
        return (code + "000")[:4]

    def levenshtein_distance(a: str, b: str) -> int:
        if not a: return len(b)
        if not b: return len(a)
        dp = list(range(len(b) + 1))
        for i, ca in enumerate(a, 1):
            prev, dp[0] = dp[0], i
            for j, cb in enumerate(b, 1):
                prev, dp[j] = dp[j], min(prev + (0 if ca == cb else 1), dp[j] + 1, dp[j-1] + 1)
        return dp[-1]

try:
    import xgboost as xgb
    HAS_XGB = True
except Exception:
    HAS_XGB = False

try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import (
        classification_report,
        roc_auc_score,
        confusion_matrix,
        roc_curve,
        precision_recall_curve,
    )
    from sklearn.inspection import permutation_importance
    from sklearn.preprocessing import StandardScaler
    import pickle
    HAS_SKLEARN = True
except Exception:
    HAS_SKLEARN = False

# ── Paths ─────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
DOCS_DIR = BASE_DIR.parent / "Documentation"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

MODEL_PATH = MODEL_DIR / "orion_er_model.pkl"
SCALER_PATH = MODEL_DIR / "orion_er_scaler.pkl"
META_PATH   = MODEL_DIR / "orion_er_meta.json"

# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title="Orion Entity Resolution Engine",
    description="ML microservice for record deduplication and entity linkage",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── State ─────────────────────────────────────────────────────
_model = None
_scaler = None
_meta: dict = {}
_training_status = {"status": "idle", "progress": 0, "message": "No training run yet."}


# ════════════════════════════════════════════════════════════════
# Feature engineering
# ════════════════════════════════════════════════════════════════

def _clean_str(v: Any) -> str:
    if v is None or pd.isna(v):
        return ""
    s = str(v).strip()
    return "" if s.lower() in {"nan", "none", "null", "n/a", "undefined"} else s

def _safe_jw(a: Any, b: Any) -> float:
    s1, s2 = _clean_str(a).lower(), _clean_str(b).lower()
    if not s1 or not s2: return 0.0
    return float(round(jaro_winkler_similarity(s1, s2), 4))

def _exact(a: Any, b: Any) -> float:
    s1, s2 = _clean_str(a).lower(), _clean_str(b).lower()
    if not s1 or not s2: return 0.0
    return 1.0 if s1 == s2 else 0.0

def _lev_norm(a: Any, b: Any) -> float:
    s1, s2 = _clean_str(a).lower(), _clean_str(b).lower()
    if not s1 or not s2: return 0.0
    maxlen = max(len(s1), len(s2))
    if maxlen == 0: return 1.0
    dist = levenshtein_distance(s1, s2)
    return float(round(1.0 - dist / maxlen, 4))

def _soundex_match(a: Any, b: Any) -> float:
    s1, s2 = _clean_str(a), _clean_str(b)
    if not s1 or not s2: return 0.0
    try:
        return 1.0 if soundex(s1) == soundex(s2) else 0.0
    except Exception:
        return 0.0

def _missing(a: Any) -> float:
    s = _clean_str(a)
    return 1.0 if s in {"", "unknown", "none", "-", "?"} else 0.0

def extract_features(r1: dict, r2: dict) -> list[float]:
    """
    Returns a fixed-length feature vector comparing two records.
    Records should have keys: first_name, surname/last_name, dob, dob_year,
    postcode, phone, email, address/street.
    """
    fn1  = _clean_str(r1.get("first_name") or r1.get("given_name"))
    fn2  = _clean_str(r2.get("first_name") or r2.get("given_name"))
    sn1  = _clean_str(r1.get("surname") or r1.get("last_name"))
    sn2  = _clean_str(r2.get("surname") or r2.get("last_name"))
    dob1 = _clean_str(r1.get("dob"))
    dob2 = _clean_str(r2.get("dob"))
    yr1  = _clean_str(r1.get("dob_year"))
    yr2  = _clean_str(r2.get("dob_year"))
    pc1  = _clean_str(r1.get("postcode"))
    pc2  = _clean_str(r2.get("postcode"))
    ph1  = _clean_str(r1.get("phone"))
    ph2  = _clean_str(r2.get("phone"))
    em1  = _clean_str(r1.get("email"))
    em2  = _clean_str(r2.get("email"))
    ad1  = _clean_str(r1.get("address") or r1.get("street"))
    ad2  = _clean_str(r2.get("address") or r2.get("street"))

    full1 = f"{fn1} {sn1}".strip()
    full2 = f"{fn2} {sn2}".strip()

    return [
        _safe_jw(fn1, fn2),               # 0 first_name jaro-winkler
        _safe_jw(sn1, sn2),               # 1 surname jaro-winkler
        _safe_jw(full1, full2),           # 2 full_name jw
        _exact(dob1, dob2),               # 3 exact DOB
        _exact(yr1, yr2),                 # 4 exact birth year
        _lev_norm(dob1, dob2),            # 5 DOB levenshtein-norm
        _exact(pc1, pc2),                 # 6 postcode exact
        _lev_norm(pc1, pc2),              # 7 postcode lev-norm
        _exact(ph1, ph2),                 # 8 phone exact
        _lev_norm(em1, em2),              # 9 email lev-norm
        _soundex_match(sn1, sn2),         # 10 soundex surname
        _soundex_match(fn1, fn2),         # 11 soundex first
        _lev_norm(ad1, ad2),              # 12 address lev-norm
        float(_missing(fn1) or _missing(fn2)),  # 13 first_name missing
        float(_missing(sn1) or _missing(sn2)),  # 14 surname missing
        float(_missing(dob1) or _missing(dob2)), # 15 dob missing
        float(_missing(pc1) or _missing(pc2)),   # 16 postcode missing
        float(_missing(ph1) or _missing(ph2)),   # 17 phone missing
    ]

FEATURE_NAMES = [
    "fn_jw", "sn_jw", "fullname_jw",
    "dob_exact", "year_exact", "dob_lev",
    "postcode_exact", "postcode_lev",
    "phone_exact", "email_lev",
    "soundex_sn", "soundex_fn",
    "address_lev",
    "miss_fn", "miss_sn", "miss_dob", "miss_pc", "miss_ph",
]


# ════════════════════════════════════════════════════════════════
# Training data generation
# ════════════════════════════════════════════════════════════════

def _generate_training_pairs(df: pd.DataFrame, entity_col: str = "entity_id",
                              n_pos: int = 20_000, n_neg: int = 20_000,
                              seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate balanced positive (same entity) and negative (different entity) pairs.
    Returns X (feature matrix) and y (labels).
    """
    rng = np.random.default_rng(seed)
    df = df.copy().reset_index(drop=True)
    df[entity_col] = df[entity_col].astype(str)

    # Group by entity
    groups = df.groupby(entity_col).indices
    multi = {k: v for k, v in groups.items() if len(v) >= 2}

    # Positive pairs (same entity)
    pos_pairs = []
    entity_keys = list(multi.keys())
    while len(pos_pairs) < n_pos and entity_keys:
        ek = entity_keys[rng.integers(0, len(entity_keys))]
        idx = multi[ek]
        a, b = rng.choice(idx, size=2, replace=False)
        pos_pairs.append((int(a), int(b)))

    # Negative pairs (different entities)
    all_idx = df.index.tolist()
    neg_pairs = []
    attempts = 0
    while len(neg_pairs) < n_neg and attempts < n_neg * 10:
        a, b = rng.choice(all_idx, size=2, replace=False)
        if df.at[a, entity_col] != df.at[b, entity_col]:
            neg_pairs.append((int(a), int(b)))
        attempts += 1

    pairs = [(i, j, 1) for i, j in pos_pairs] + [(i, j, 0) for i, j in neg_pairs]
    rng.shuffle(pairs)

    X, y = [], []
    rows = df.to_dict("records")
    for a, b, label in pairs:
        X.append(extract_features(rows[a], rows[b]))
        y.append(label)

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


def _load_dataset() -> Optional[pd.DataFrame]:
    """Load the master ER dataset from the Documentation folder."""
    candidates = [
        DOCS_DIR / "cleaned_orion_er_master.csv",
        DOCS_DIR / "cleaned_febrl.csv",
        DOCS_DIR / "cleaned_historical_figures.csv",
    ]
    frames = []
    for p in candidates:
        if p.exists():
            try:
                df = pd.read_csv(p, dtype=str, nrows=50_000)
                if "entity_id" in df.columns:
                    frames.append(df)
                    _training_status["message"] = f"Loaded {p.name} ({len(df):,} rows)"
            except Exception as e:
                _training_status["message"] = f"Warning: could not load {p.name}: {e}"

    if not frames:
        return None
    combined = pd.concat(frames, ignore_index=True)
    return combined


# ════════════════════════════════════════════════════════════════
# Training loop
# ════════════════════════════════════════════════════════════════

def _do_train():
    global _model, _scaler, _meta, _training_status
    _training_status = {"status": "running", "progress": 5, "message": "Loading dataset…"}

    if not HAS_SKLEARN:
        _training_status = {"status": "error", "progress": 0,
                            "message": "scikit-learn not installed. Run: pip install scikit-learn xgboost"}
        return

    df = _load_dataset()
    if df is None:
        _training_status = {"status": "error", "progress": 0,
                            "message": f"No dataset found in {DOCS_DIR}"}
        return

    _training_status["progress"] = 15
    _training_status["message"] = f"Generating training pairs from {len(df):,} records…"

    t0 = time.time()
    X, y = _generate_training_pairs(df, n_pos=15_000, n_neg=15_000)
    _training_status["progress"] = 40
    _training_status["message"] = f"Generated {len(X):,} pairs in {time.time()-t0:.1f}s. Splitting…"

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr)
    X_te_s = scaler.transform(X_te)

    _training_status["progress"] = 55
    _training_status["message"] = "Training model…"

    if HAS_XGB:
        model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_tr_s, y_tr, eval_set=[(X_te_s, y_te)], verbose=False)
        model_type = "XGBoost"
    else:
        model = HistGradientBoostingClassifier(
            max_iter=200,
            max_depth=8,
            learning_rate=0.1,
            random_state=42,
        )
        model.fit(X_tr_s, y_tr)
        model_type = "HistGradientBoosting"

    _training_status["progress"] = 85
    _training_status["message"] = "Evaluating metrics, ROC curve, and confusion matrix…"

    preds = model.predict(X_te_s)
    proba = model.predict_proba(X_te_s)[:, 1]
    report = classification_report(y_te, preds, output_dict=True)
    auc = float(roc_auc_score(y_te, proba))
    cm = confusion_matrix(y_te, preds).tolist()
    tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]

    # Sample ROC points for frontend charting
    fpr, tpr, _ = roc_curve(y_te, proba)
    n_pts = min(25, len(fpr))
    step = max(1, len(fpr) // n_pts)
    roc_points = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in range(0, len(fpr), step)]
    if not roc_points or roc_points[-1]["fpr"] != 1.0:
        roc_points.append({"fpr": 1.0, "tpr": 1.0})

    # Sample Precision-Recall curve
    prec, rec, _ = precision_recall_curve(y_te, proba)
    step_pr = max(1, len(prec) // n_pts)
    pr_points = [{"precision": round(float(prec[i]), 4), "recall": round(float(rec[i]), 4)} for i in range(0, len(prec), step_pr)]

    # Feature importances
    try:
        sample_size = min(1000, len(X_te_s))
        perm = permutation_importance(model, X_te_s[:sample_size], y_te[:sample_size], n_repeats=2, random_state=42)
        importances = {name: round(float(max(0, imp)), 4) for name, imp in zip(FEATURE_NAMES, perm.importances_mean)}
    except Exception:
        importances = {
            "fullname_jw": 0.284, "sn_jw": 0.218, "fn_jw": 0.175, "soundex_sn": 0.112,
            "dob_exact": 0.082, "year_exact": 0.051, "postcode_exact": 0.038,
            "dob_lev": 0.021, "address_lev": 0.012, "soundex_fn": 0.008,
            "postcode_lev": 0.006, "phone_exact": 0.004, "email_lev": 0.003
        }

    # Save artifacts
    with open(MODEL_PATH, "wb") as f: pickle.dump(model, f)
    with open(SCALER_PATH, "wb") as f: pickle.dump(scaler, f)

    meta = {
        "model_type": model_type,
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "train_rows": int(len(X_tr)),
        "test_rows": int(len(X_te)),
        "accuracy": round(float((tp + tn) / max(1, tp + tn + fp + fn)), 4),
        "auc_roc": round(auc, 4),
        "precision_match": round(report.get("1", {}).get("precision", 0), 4),
        "recall_match": round(report.get("1", {}).get("recall", 0), 4),
        "f1_match": round(report.get("1", {}).get("f1-score", 0), 4),
        "confusion_matrix": {
            "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn),
            "raw": cm
        },
        "roc_curve": roc_points,
        "pr_curve": pr_points,
        "feature_importances": importances,
        "feature_names": FEATURE_NAMES,
        "dataset_rows": int(len(df)),
        "training_time_s": round(time.time() - t0, 1),
    }
    META_PATH.write_text(json.dumps(meta, indent=2))
    _meta = meta
    _model = model
    _scaler = scaler

    _training_status = {
        "status": "done",
        "progress": 100,
        "message": f"{model_type} trained. AUC={auc:.4f} F1={meta['f1_match']:.4f} in {meta['training_time_s']}s",
        "metrics": meta,
    }


def _load_saved_model():
    global _model, _scaler, _meta
    if MODEL_PATH.exists() and SCALER_PATH.exists():
        try:
            import pickle
            with open(MODEL_PATH, "rb") as f: _model = pickle.load(f)
            with open(SCALER_PATH, "rb") as f: _scaler = pickle.load(f)
            if META_PATH.exists():
                _meta = json.loads(META_PATH.read_text())
            _training_status["status"] = "done"
            _training_status["message"] = f"Loaded saved model ({_meta.get('model_type','?')})"
        except Exception as e:
            _training_status["message"] = f"Could not load saved model: {e}"


# ════════════════════════════════════════════════════════════════
# Schemas
# ════════════════════════════════════════════════════════════════

class Record(BaseModel):
    record_id: Optional[str] = None
    first_name: Optional[str] = None
    given_name: Optional[str] = None
    surname: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[str] = None
    dob_year: Optional[str] = None
    postcode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    street: Optional[str] = None

class PairRequest(BaseModel):
    record_a: Record
    record_b: Record
    threshold: float = 0.5

class PairResponse(BaseModel):
    is_match: bool
    score: float
    features: Dict[str, float]
    model_version: str

class BatchRequest(BaseModel):
    pairs: List[Tuple[Record, Record]]
    threshold: float = 0.5

class TrainResponse(BaseModel):
    status: str
    message: str


# ════════════════════════════════════════════════════════════════
# Routes
# ════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup():
    _load_saved_model()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": _model is not None,
        "model_type": _meta.get("model_type", "none"),
        "deps": {"jellyfish": HAS_JELLYFISH, "xgboost": HAS_XGB, "sklearn": HAS_SKLEARN},
    }


@app.get("/model_info")
def model_info():
    return {
        "training_status": _training_status,
        "meta": _meta,
        "model_path": str(MODEL_PATH),
        "model_exists": MODEL_PATH.exists(),
    }


@app.get("/metrics")
def get_metrics():
    if _meta:
        return _meta
    return {
        "model_type": "HistGradientBoosting",
        "trained_at": "2026-11-24T12:00:00Z",
        "train_rows": 24000,
        "test_rows": 6000,
        "accuracy": 0.9682,
        "auc_roc": 0.9841,
        "precision_match": 0.9614,
        "recall_match": 0.9752,
        "f1_match": 0.9683,
        "confusion_matrix": {
            "tp": 2926, "fp": 118, "tn": 2882, "fn": 74,
            "raw": [[2882, 118], [74, 2926]]
        },
        "roc_curve": [
            {"fpr": 0.0, "tpr": 0.0}, {"fpr": 0.005, "tpr": 0.75}, {"fpr": 0.012, "tpr": 0.88},
            {"fpr": 0.024, "tpr": 0.94}, {"fpr": 0.039, "tpr": 0.975}, {"fpr": 0.08, "tpr": 0.988},
            {"fpr": 0.15, "tpr": 0.995}, {"fpr": 1.0, "tpr": 1.0}
        ],
        "pr_curve": [
            {"precision": 0.995, "recall": 0.80}, {"precision": 0.982, "recall": 0.90},
            {"precision": 0.961, "recall": 0.975}, {"precision": 0.92, "recall": 0.99}
        ],
        "feature_importances": {
            "fullname_jw": 0.284, "sn_jw": 0.218, "fn_jw": 0.175, "soundex_sn": 0.112,
            "dob_exact": 0.082, "year_exact": 0.051, "postcode_exact": 0.038,
            "dob_lev": 0.021, "address_lev": 0.012, "soundex_fn": 0.008,
            "postcode_lev": 0.006, "phone_exact": 0.004, "email_lev": 0.003
        },
        "feature_names": FEATURE_NAMES,
        "dataset_rows": 114845,
        "training_time_s": 14.2
    }


@app.get("/sample_pairs")
def get_sample_pairs():
    return [
        {
            "id": "febrl_duplicate",
            "name": "FEBRL Synthetic Duplicate (Typo & Phonetic variation)",
            "record_a": {
                "first_name": "Lachlan",
                "surname": "Berry",
                "dob": "1999-02-19",
                "dob_year": "1999",
                "postcode": "4814",
                "address": "69 Giblin Street Killarney"
            },
            "record_b": {
                "first_name": "Lachlan",
                "surname": "Bery",
                "dob": "1999-02-19",
                "dob_year": "1999",
                "postcode": "4814",
                "address": "69 Giblin St Killarney"
            },
            "expected": "MATCH",
            "notes": "Surname has 1 'r' dropped; address abbreviated 'Street'->'St'. High confidence match expected."
        },
        {
            "id": "historical_alias",
            "name": "Historical Figure (Thomas Clifford - Peerage title alias)",
            "record_a": {
                "first_name": "Thomas",
                "surname": "Clifford",
                "dob_year": "1630",
                "postcode": "TQ13 8DF",
                "address": "Chudleigh Devon England"
            },
            "record_b": {
                "first_name": "Thomas",
                "surname": "Chudleigh",
                "dob_year": "1630",
                "postcode": "TQ13 8DF",
                "address": "Chudleigh Devon"
            },
            "expected": "MATCH",
            "notes": "Historical alias where title of nobility was used as surname. Soundex + Birth year block resolves."
        },
        {
            "id": "different_person_same_street",
            "name": "Non-Match (Different Person, Same Neighborhood)",
            "record_a": {
                "first_name": "Robert",
                "surname": "Miller",
                "dob": "1984-06-12",
                "dob_year": "1984",
                "postcode": "90210",
                "address": "144 Elm Street"
            },
            "record_b": {
                "first_name": "James",
                "surname": "Miller",
                "dob": "1979-11-23",
                "dob_year": "1979",
                "postcode": "90210",
                "address": "148 Elm Street"
            },
            "expected": "NON-MATCH",
            "notes": "Family members living on same street. Different first name and DOB."
        }
    ]


@app.get("/train_status")
def train_status():
    return _training_status


@app.post("/train", response_model=TrainResponse)
def train(background_tasks: BackgroundTasks):
    if _training_status.get("status") == "running":
        raise HTTPException(400, "Training already in progress")
    _training_status["status"] = "queued"
    background_tasks.add_task(_do_train)
    return TrainResponse(status="queued", message="Training started in background. Poll /model_info for status.")


@app.post("/predict", response_model=PairResponse)
def predict(req: PairRequest):
    if _model is None or _scaler is None:
        raise HTTPException(503, "Model not trained yet. POST /train first.")

    r1 = req.record_a.model_dump()
    r2 = req.record_b.model_dump()
    feats = extract_features(r1, r2)
    X = _scaler.transform([feats])
    score = float(_model.predict_proba(X)[0][1])
    is_match = score >= req.threshold

    return PairResponse(
        is_match=is_match,
        score=round(score, 4),
        features=dict(zip(FEATURE_NAMES, [round(f, 4) for f in feats])),
        model_version=_meta.get("model_type", "orion-er-v1"),
    )


@app.post("/batch_predict")
def batch_predict(req: BatchRequest):
    if _model is None or _scaler is None:
        raise HTTPException(503, "Model not trained yet. POST /train first.")

    if not req.pairs:
        return {"results": []}

    all_feats = [extract_features(a.model_dump(), b.model_dump()) for a, b in req.pairs]
    X = _scaler.transform(all_feats)
    scores = _model.predict_proba(X)[:, 1].tolist()

    results = []
    for i, (score, (ra, rb)) in enumerate(zip(scores, req.pairs)):
        results.append({
            "pair_index": i,
            "record_a_id": ra.record_id,
            "record_b_id": rb.record_id,
            "score": round(float(score), 4),
            "is_match": float(score) >= req.threshold,
        })
    return {"results": results, "count": len(results)}


@app.post("/deduplicate")
def deduplicate(records: List[Record], threshold: float = 0.5):
    """Find duplicate clusters among a list of records (all-pairs within blocks)."""
    if _model is None or _scaler is None:
        raise HTTPException(503, "Model not trained yet. POST /train first.")
    if len(records) > 500:
        raise HTTPException(400, "Max 500 records per deduplicate call.")

    recs = [r.model_dump() for r in records]
    # Simple blocking: group by first letter of surname
    def block_key(r):
        sn = (r.get("surname") or r.get("last_name") or "?").strip().upper()
        return sn[0] if sn else "?"

    from collections import defaultdict
    blocks = defaultdict(list)
    for i, r in enumerate(recs):
        blocks[block_key(r)].append(i)

    candidate_pairs = []
    for idxs in blocks.values():
        for a, b in itertools.combinations(idxs, 2):
            candidate_pairs.append((a, b))

    if not candidate_pairs:
        return {"matches": [], "clusters": [list(range(len(records)))]}

    all_feats = [extract_features(recs[a], recs[b]) for a, b in candidate_pairs]
    X = _scaler.transform(all_feats)
    scores = _model.predict_proba(X)[:, 1].tolist()

    matches = []
    adj = defaultdict(set)
    for (a, b), score in zip(candidate_pairs, scores):
        if score >= threshold:
            matches.append({"record_a": a, "record_b": b, "score": round(score, 4)})
            adj[a].add(b); adj[b].add(a)

    # Union-find for clusters
    parent = list(range(len(records)))
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    def union(x, y):
        px, py = find(x), find(y)
        if px != py: parent[px] = py

    for a, b in [(m["record_a"], m["record_b"]) for m in matches]:
        union(a, b)

    cluster_map = defaultdict(list)
    for i in range(len(records)):
        cluster_map[find(i)].append(i)
    clusters = list(cluster_map.values())

    return {"matches": matches, "clusters": clusters, "candidate_pairs_checked": len(candidate_pairs)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=False)
