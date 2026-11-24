"""Reusable cleaning primitives used by every dataset-specific pipeline."""
import re, unicodedata, numpy as np, pandas as pd, jellyfish

STEPS = []   # global audit trail of every preprocessing step (feeds the report tables)

def log_step(dataset, step, description, changed, rows_before, rows_after):
    STEPS.append(dict(dataset=dataset, step=step, description=description,
                      cells_changed=int(changed), rows_before=int(rows_before), rows_after=int(rows_after)))

NA_TOKENS = {"", "n/a", "na", "null", "none", "nan", "unknown", "-", "--", "?", "undefined", "not available"}

def S(x): return x.astype("string")

def changed(b, a):
    """Number of cells whose value differs (NA == NA)."""
    return int((S(b).fillna("\x00") != S(a).fillna("\x00")).sum())

def strip_accents(s):
    return S(s).str.normalize("NFKD").str.encode("ascii", "ignore").str.decode("ascii")

def norm_text(s):
    """lower-case, strip accents, drop apostrophes, non-alphanumerics -> space, collapse whitespace."""
    s = strip_accents(s).str.lower().str.replace("'", "", regex=False)
    s = s.str.replace(r"[^a-z0-9 ]", " ", regex=True).str.replace(r"\s+", " ", regex=True).str.strip()
    return s.mask(s == "")

def placeholders_to_na(s):
    t = S(s).str.strip().str.lower()
    return S(s).mask(t.isin(NA_TOKENS))

_DIM = np.array([0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
def _days_in_month(y, m):
    leap = ((y % 4 == 0) & (y % 100 != 0)) | (y % 400 == 0)
    mi = np.clip(m, 0, 12).astype(int)
    return _DIM[mi] + ((mi == 2) & leap)

_PATS = [(r"^(-?\d{1,4})-(\d{2})-(\d{2})$", "ymd"), (r"^(\d{2})/(\d{2})/(\d{4})$", "dmy"),
         (r"^(\d{2})-(\d{2})-(\d{4})$", "mdy"), (r"^(\d{4})(\d{2})(\d{2})$", "ymd")]

def parse_dates(s, min_year=1000, max_year=2026, repair_swap=True):
    """Parse mixed-format dates -> ISO 'YYYY-MM-DD' (string) + year (Int64).
    Returns iso, year, stats(dict).  Repairs day/month swaps (month>12, day<=12). Invalid -> NA."""
    s = S(s).str.strip()
    n = len(s); Y = np.full(n, np.nan); M = np.full(n, np.nan); D = np.full(n, np.nan)
    for pat, order in _PATS:
        ex = s.str.extract(pat).astype(float)
        ok = ex[0].notna().to_numpy()
        pos = {c: i for i, c in enumerate(order)}
        Y[ok] = ex[pos["y"]].to_numpy()[ok]; M[ok] = ex[pos["m"]].to_numpy()[ok]; D[ok] = ex[pos["d"]].to_numpy()[ok]
    parsed = ~np.isnan(Y)
    swapped = np.zeros(n, bool)
    if repair_swap:
        sw = parsed & (M > 12) & (D >= 1) & (D <= 12)
        M[sw], D[sw] = D[sw].copy(), M[sw].copy(); swapped = sw
    year_ok = parsed & (Y >= min_year) & (Y <= max_year)
    full_ok = year_ok & (M >= 1) & (M <= 12) & (D >= 1) & (D <= _days_in_month(np.nan_to_num(Y), np.nan_to_num(M)))
    iso = pd.Series(pd.NA, index=s.index, dtype="string")
    yy = pd.Series(Y[full_ok].astype(int), index=s.index[full_ok]).astype(str).str.zfill(4)
    mm = pd.Series(M[full_ok].astype(int), index=s.index[full_ok]).astype(str).str.zfill(2)
    dd = pd.Series(D[full_ok].astype(int), index=s.index[full_ok]).astype(str).str.zfill(2)
    iso.loc[s.index[full_ok]] = (yy + "-" + mm + "-" + dd).astype("string")
    year = pd.Series(pd.NA, index=s.index, dtype="Int64"); year[year_ok] = Y[year_ok].astype(int)
    non_null = s.notna().to_numpy()
    stats = dict(non_null=int(non_null.sum()), valid=int(full_ok.sum()), repaired_swap=int((swapped & full_ok).sum()),
                 invalid=int((non_null & ~full_ok).sum()), year_only=int((year_ok & ~full_ok).sum()))
    return iso, year, stats

def soundex(s):
    def f(x):
        if not isinstance(x, str) or not x: return pd.NA
        try: return jellyfish.soundex(x.replace(" ", ""))
        except Exception: return pd.NA
    return S(s).map(f).astype("string")

ADDR_DIR = {"n": "north", "s": "south", "e": "east", "w": "west"}
ADDR_SUF = {"st": "street", "str": "street", "ave": "avenue", "av": "avenue", "blvd": "boulevard", "rd": "road",
            "dr": "drive", "pl": "place", "ct": "court", "ln": "lane", "pkwy": "parkway", "hwy": "highway",
            "apt": "apartment", "ste": "suite"}
def std_address(s):
    """Normalise postal addresses: lower, strip punctuation, expand directional (after house number) and suffix (end)."""
    s = norm_text(s)
    s = s.str.replace(r"^(\d+)\s+([nsew])\b", lambda m: f"{m.group(1)} {ADDR_DIR[m.group(2)]}", regex=True)
    s = s.str.replace(r"\b(" + "|".join(ADDR_SUF) + r")\b", lambda m: ADDR_SUF[m.group(1)], regex=True)
    return s

def n_missing(df, cols): return df[cols].isna().sum(axis=1).astype("int8")
