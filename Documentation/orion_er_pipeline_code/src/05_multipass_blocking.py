"""Step 4: preview of multi-pass blocking (union of several keys) -> informs the ER model design (next phase)."""
import json, numpy as np, pandas as pd
from common import *
S = lambda x: x.astype("string")
def cat(*cols):
    out = S(cols[0])
    for c in cols[1:]: out = out + "|" + S(c)
    return out
def evaluate(df, keys, ent="entity_id"):
    n = len(df); tot = n*(n-1)//2; cand = 0
    for k in keys.values():
        vc = k.value_counts(); cand += int((vc*(vc-1)//2).sum())
    pairs = df[[ent]].reset_index().merge(df[[ent]].reset_index(), on=ent)
    pairs = pairs[pairs.index_x < pairs.index_y]; found = np.zeros(len(pairs), bool); per = {}
    for name, k in keys.items():
        kx = k.reindex(pairs.index_x).reset_index(drop=True); ky = k.reindex(pairs.index_y).reset_index(drop=True)
        hit = (kx == ky).fillna(False).to_numpy().astype(bool); per[name] = round(float(hit.mean()), 4); found |= hit
    return dict(records=n, true_pairs=int(len(pairs)), candidate_pairs_upper_bound=cand, reduction_ratio=1-cand/tot,
                pair_completeness_union=float(found.mean()), per_key=per)
hist = pd.read_csv(PROC/"cleaned_historical_figures.csv", dtype=str)
febrl = pd.read_csv(PROC/"cleaned_febrl.csv", dtype=str)
syn = pd.read_csv(PROC/"cleaned_synthetic_enterprise_1M.csv.gz", dtype=str)
res = {}
res["Historical Figures"] = evaluate(hist, {"soundex(surname)+birth_year": cat(hist.surname_soundex, hist.dob_year),
    "first_initial+surname[:3]": cat(hist.first_initial, hist.surname.str[:3]), "full dob": S(hist.dob),
    "soundex(surname)+birth_place": cat(hist.surname_soundex, hist.birth_place), "first_name[:3]+birth_year": cat(hist.first_name.str[:3], hist.dob_year)})
res["Febrl"] = evaluate(febrl, {"soundex(surname)+postcode": febrl.block_key, "full dob": S(febrl.dob), "soc_sec_id": S(febrl.soc_sec_id),
    "given[:3]+surname[:3]": cat(febrl.given_name.str[:3], febrl.surname.str[:3]), "surname_soundex+dob_year": cat(febrl.surname_soundex, febrl.dob_year)})
res["Synthetic 1M"] = evaluate(syn, {"soundex(last)+birth_year": syn.block_key, "phone": S(syn.phone), "first_initial+last[:3]+postcode": cat(syn.first_initial, syn.last_name.str[:3], syn.postcode),
    "dob+last[:2]": cat(syn.dob, syn.last_name.str[:2]), "email": S(syn.email)})
for k, v in res.items(): print(k, {a: (round(b, 5) if isinstance(b, float) else b) for a, b in v.items()})
(LOGS/"multipass_blocking.json").write_text(json.dumps(res, indent=1))
