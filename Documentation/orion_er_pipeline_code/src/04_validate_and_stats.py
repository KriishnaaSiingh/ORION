"""Step 3: post-cleaning validation + EDA statistics + blocking-key quality (pair completeness / reduction ratio)."""
import json, numpy as np, pandas as pd
from common import *
P = PROC; R = {}
hist = pd.read_csv(P/"cleaned_historical_figures.csv", dtype=str)
febrl = pd.read_csv(P/"cleaned_febrl.csv", dtype=str)
chi = pd.read_csv(P/"cleaned_chicago_providers.csv", dtype=str)
syn = pd.read_csv(P/"cleaned_synthetic_enterprise_1M.csv.gz", dtype=str)
master = pd.read_csv(P/"cleaned_orion_er_master.csv", dtype=str)

def blocking_quality(df, ent="entity_id", key="block_key"):
    n = len(df); total_pairs = n*(n-1)//2
    k = df[key].dropna(); bs = k.value_counts(); blocked = int((bs*(bs-1)//2).sum())
    g = df.groupby(ent).size(); true_pairs = int((g*(g-1)//2).sum())
    d2 = df.dropna(subset=[key]); gg = d2.groupby([ent, key]).size(); found = int((gg*(gg-1)//2).sum())
    return dict(records=n, total_pairs=total_pairs, blocked_pairs=blocked,
                reduction_ratio=1-blocked/total_pairs, true_pairs=true_pairs, true_pairs_in_block=found,
                pair_completeness=found/true_pairs if true_pairs else None, n_blocks=int(len(bs)), max_block=int(bs.max()), blocks_gt1=int((bs>1).sum()))

R["blocking"] = {"Historical Figures": blocking_quality(hist), "Febrl": blocking_quality(febrl), "Synthetic 1M": blocking_quality(syn)}
for k, v in R["blocking"].items(): print(k, {a: (round(b, 5) if isinstance(b, float) else b) for a, b in v.items()})

# ground-truth structure
R["entities"] = {"hist": hist.groupby("entity_id").size().describe().round(2).to_dict(),
                 "febrl": febrl.groupby("entity_id").size().describe().round(2).to_dict(),
                 "syn": syn.groupby("entity_id").size().describe().round(2).to_dict()}
R["entity_counts"] = {"hist": int(hist.entity_id.nunique()), "febrl": int(febrl.entity_id.nunique()), "syn": int(syn.entity_id.nunique())}
# value distributions
R["hist_occupation"] = hist.occupation.value_counts().head(10).to_dict()
R["hist_gender"] = hist.gender.value_counts(dropna=False).rename({np.nan: "missing"}).to_dict()
R["syn_source"] = syn.source_system.value_counts().to_dict(); R["syn_country"] = syn.country.value_counts().to_dict()
R["syn_gender"] = syn.gender.value_counts(dropna=False).to_dict()
R["febrl_state"] = febrl.state.value_counts(dropna=False).to_dict()
R["chi_source"] = chi.source.value_counts().to_dict()
R["chi_missing"] = (chi.isna().mean()*100).round(1).to_dict()
# integrity checks (all must be True)
chk = {
 "hist record_id unique": bool(hist.record_id.is_unique), "febrl record_id unique": bool(febrl.record_id.is_unique),
 "syn record_id unique": bool(syn.record_id.is_unique), "master record_id unique": bool(master.record_id.is_unique),
 "hist gender in {male,female,NA}": bool(hist.gender.dropna().isin(["male","female"]).all()),
 "all ISO dates length 10 (hist)": bool(hist.dob.dropna().str.fullmatch(r"\d{4}-\d{2}-\d{2}").all()),
 "all ISO dates length 10 (syn)": bool(syn.dob.dropna().str.fullmatch(r"\d{4}-\d{2}-\d{2}").all()),
 "syn phone 10 digits": bool(syn.phone.dropna().str.fullmatch(r"\d{10}").all()),
 "syn email valid": bool(syn.email.dropna().str.contains("@").all()),
 "syn risk_score in 0-100": bool(pd.to_numeric(syn.risk_score).dropna().between(0,100).all()),
 "syn balance >= 0": bool((pd.to_numeric(syn.account_balance).dropna()>=0).all()),
 "chi phone 7/10 digits": bool(chi.phone.dropna().str.fullmatch(r"\d{7}|\d{10}").all()),
 "febrl state in 8 codes": bool(febrl.state.dropna().isin(["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"]).all()),
}
R["integrity"] = chk; print(chk); assert all(chk.values())
# a before/after cluster example for the report
raw = load_raw()["historical_figures_50k"]; ex_id = raw.cluster.value_counts().index[200]
R["example_cluster"] = ex_id
rr = raw[raw.cluster == ex_id].head(4)[["unique_id","full_name","dob","birth_place","gender","postcode_fake"]].fillna("NA").astype(str).values.tolist()
cc = hist[hist.entity_id == "hist_"+ex_id].head(4)[["record_id","full_name","dob","birth_place","gender","postcode"]].fillna("NA").values.tolist()
R["example_raw"], R["example_clean"] = rr, cc
# raw disguised-missing (placeholders counted as missing) for synthetic
from prep_utils import NA_TOKENS
rs = load_raw()["synthetic_enterprise_1M"]
dm = {c: round(100*float(rs[c].str.strip().str.lower().isin(NA_TOKENS).mean()), 2) for c in rs.columns if c not in ("record_id","entity_id")}
R["syn_raw_disguised_missing"] = dm; R["syn_clean_missing"] = (syn.drop(columns=["record_id","entity_id"]).isna().mean()*100).round(2).to_dict()
(LOGS/"stats.json").write_text(json.dumps(R, indent=1, default=str)); print("saved")
