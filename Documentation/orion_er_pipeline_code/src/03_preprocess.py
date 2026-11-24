"""Step 2: preprocessing pipelines for every dataset + unified master file."""
import json, time, re
from common import *
from prep_utils import *

raw = load_raw(); TIMING = {}

# =====================================================================================
# A. Historical Figures (50k, labelled)
# =====================================================================================
def clean_hist(df):
    ds = "Historical Figures"; n0 = len(df); t = time.time()
    d = df.rename(columns={"unique_id": "record_id", "cluster": "entity_id", "postcode_fake": "postcode", "dob": "dob_raw"})
    d = d.drop(columns="first_and_surname")
    d["entity_id"] = "hist_" + d["entity_id"]
    log_step(ds, "Schema standardisation", "Renamed unique_id/cluster/postcode_fake/dob; dropped redundant first_and_surname", 0, n0, len(d))
    ch = 0
    for c in ["full_name", "first_name", "surname", "birth_place", "occupation"]:
        b = d[c]; d[c] = norm_text(d[c]); ch += changed(b, d[c])
    log_step(ds, "Text normalisation", "Lower-case, strip accents (258 non-ASCII names), remove punctuation, collapse spaces", ch, len(d), len(d))
    b = d.gender; g = S(d.gender).str.strip().str.lower()
    d["gender"] = g.where(g.isin(["male", "female"]))
    log_step(ds, "Invalid category removal", "gender restricted to {male, female}; Wikidata Q-codes (t22279...) and 'female | male' -> NA", changed(b, d.gender), len(d), len(d))
    iso, year, st = parse_dates(d.dob_raw)
    log_step(ds, "Date parsing & repair", f"Parsed DOB to ISO; {st['repaired_swap']:,} day/month swaps repaired; {st['invalid']:,} impossible dates (month 0, day 0, BCE/<1000) -> NA", st["repaired_swap"] + st["invalid"], len(d), len(d))
    d["dob"] = iso; d["dob_year"] = year; d = d.drop(columns="dob_raw")
    b = d.postcode; p = S(d.postcode).str.upper().str.replace(r"\s+", " ", regex=True).str.strip()
    d["postcode"] = p.where(p.str.match(r"^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$", na=False))
    inv = int((b.notna() & d.postcode.isna()).sum())
    log_step(ds, "Postcode validation", f"Upper-case + validate UK postcode pattern; {inv:,} invalid values -> NA", inv, len(d), len(d))
    nm = d[["full_name", "first_name", "surname"]].isna().all(axis=1)
    d = d[~nm]; log_step(ds, "Remove unidentifiable rows", "Dropped rows with NO name attribute (cannot be compared by any name matcher)", 0, n0, len(d))
    nb = len(d); keep = d.drop(columns="record_id").duplicated(keep="first")
    d = d[~keep]; log_step(ds, "Exact duplicate collapse", "Removed rows identical on every attribute AND in the same ground-truth entity (no extra information)", 0, nb, len(d))
    d["first_initial"] = S(d.first_name).str[0]
    d["surname_soundex"] = soundex(d.surname)
    d["name_token_count"] = S(d.full_name).str.split().str.len().astype("Int8")
    d["block_key"] = (d.surname_soundex + "_" + S(d.dob_year)).astype("string")
    core = ["full_name", "first_name", "surname", "gender", "dob", "birth_place", "occupation", "postcode"]
    d["n_missing_core"] = n_missing(d, core)
    log_step(ds, "Feature engineering", "Added first_initial, surname_soundex, name_token_count, block_key (soundex+birth-year), n_missing_core", 0, len(d), len(d))
    TIMING[ds] = time.time() - t
    return d.reset_index(drop=True)

# =====================================================================================
# B. Febrl benchmark (1,2,3,4a,4b)
# =====================================================================================
def clean_febrl(raw):
    ds = "Febrl Benchmark"; t = time.time(); parts = []
    for name in ["febrl1", "febrl2", "febrl3", "febrl4a", "febrl4b"]:
        x = raw[name].copy(); x["febrl_set"] = name; parts.append(x)
    d = pd.concat(parts, ignore_index=True); n0 = len(d)
    ex = d.rec_id.str.extract(r"rec-(\d+)-(org|dup)")
    d["entity_id"] = d.febrl_set.str.replace(r"[ab]$", "", regex=True) + "_" + ex[0]
    d["record_role"] = ex[1]
    d["record_id"] = d.febrl_set + ":" + d.rec_id
    d = d.drop(columns="rec_id")
    log_step(ds, "Combine & label", "Stacked 5 files (21,000 records); parsed ground-truth entity id + org/dup role from rec_id", 0, n0, len(d))
    ch = 0
    for c in ["given_name", "surname", "address_1", "address_2", "suburb"]:
        b = d[c]; d[c] = norm_text(d[c]); ch += changed(b, d[c])
    log_step(ds, "Text normalisation", "Trim, collapse spaces, lower-case, remove punctuation in names/address fields", ch, len(d), len(d))
    b = d.state; s = S(d.state).str.strip().str.lower()
    d["state"] = s.where(s.isin(["nsw", "vic", "qld", "wa", "sa", "tas", "act", "nt"])).str.upper()
    inv = int((b.notna() & d.state.isna()).sum())
    log_step(ds, "Invalid category removal", f"state restricted to the 8 Australian states/territories (typos such as 'vix','nsq': {inv} values -> NA); upper-cased", inv, len(d), len(d))
    iso, year, st = parse_dates(d.date_of_birth)
    d["dob"] = iso; d["dob_year"] = year; d = d.drop(columns="date_of_birth")
    log_step(ds, "Date parsing & repair", f"YYYYMMDD -> ISO; {st['repaired_swap']:,} day/month swaps repaired; {st['invalid']:,} impossible dates -> NA", st["repaired_swap"] + st["invalid"], len(d), len(d))
    b = d.postcode; d["postcode"] = S(d.postcode).str.zfill(4).where(S(d.postcode).str.fullmatch(r"\d{4}", na=False))
    b2 = d.soc_sec_id; d["soc_sec_id"] = S(d.soc_sec_id).where(S(d.soc_sec_id).str.fullmatch(r"\d{7}", na=False))
    d["street_number"] = S(d.street_number).where(S(d.street_number).str.fullmatch(r"\d{1,4}", na=False))
    log_step(ds, "Identifier validation", "postcode must be 4 digits, soc_sec_id 7 digits, street_number numeric; else NA", changed(b, d.postcode) + changed(b2, d.soc_sec_id), len(d), len(d))
    d["full_name"] = (S(d.given_name).fillna("") + " " + S(d.surname).fillna("")).str.strip().mask(lambda x: x == "")
    d["address"] = (S(d.street_number).fillna("") + " " + S(d.address_1).fillna("") + " " + S(d.address_2).fillna("")).str.replace(r"\s+", " ", regex=True).str.strip().mask(lambda x: x == "")
    nb = len(d)
    sub = [c for c in d.columns if c not in ("record_id", "record_role")]
    d = d[~d.duplicated(subset=sub, keep="first")]
    log_step(ds, "Exact duplicate collapse", "Removed identical rows within the same file + same entity", 0, nb, len(d))
    d["first_initial"] = S(d.given_name).str[0]
    d["surname_soundex"] = soundex(d.surname)
    d["name_token_count"] = S(d.full_name).str.split().str.len().astype("Int8")
    d["block_key"] = (d.surname_soundex + "_" + S(d.postcode)).astype("string")
    core = ["given_name", "surname", "street_number", "address_1", "suburb", "postcode", "state", "dob", "soc_sec_id"]
    d["n_missing_core"] = n_missing(d, core)
    log_step(ds, "Feature engineering", "Added full_name, address, first_initial, surname_soundex, block_key (soundex+postcode), n_missing_core", 0, len(d), len(d))
    TIMING[ds] = time.time() - t
    return d.reset_index(drop=True)

# =====================================================================================
# C. Chicago childcare providers (unlabelled, multi-source organisations)
# =====================================================================================
def clean_chicago(df):
    ds = "Chicago Providers"; n0 = len(df); t = time.time()
    d = df.copy(); d.columns = [re.sub(r"\W+", "_", c.strip().lower()).strip("_") for c in d.columns]
    miss = d.isna().mean(); drop = miss[miss > .95].index.tolist(); d = d.drop(columns=drop)
    log_step(ds, "Schema & sparse-column drop", f"snake_case headers; dropped {len(drop)} columns with >95% missing: {', '.join(drop)}", 0, n0, len(d))
    ch = 0
    for c in [x for x in d.columns if not pd.api.types.is_numeric_dtype(d[x])]:
        if c in ("id",): continue
        b = d[c]; d[c] = placeholders_to_na(d[c]); ch += changed(b, d[c])
    log_step(ds, "Placeholder -> NA", "Tokens such as '', 'n/a', 'none', 'null', '-' converted to true missing values", ch, len(d), len(d))
    d["source"] = S(d.source).str.replace(r"\.csv$", "", regex=True).str.lower().str.strip()
    b = d.site_name; d["site_name"] = norm_text(d.site_name)
    d["site_name"] = d.site_name.str.replace(r"\b(sch)\b", "school", regex=True).str.replace(r"\b(ctr|cntr)\b", "center", regex=True).str.replace(r"\b(assoc)\b", "association", regex=True).str.replace(r"\b(elem)\b", "elementary", regex=True)
    ch = changed(b, d.site_name)
    for c in ["program_name", "length_of_day", "neighborhood", "program_option", "website"]:
        if c in d.columns and c != "website":
            b = d[c]; d[c] = norm_text(d[c]); ch += changed(b, d[c])
    log_step(ds, "Text normalisation", "Lower-case/punctuation clean; expanded sch/ctr/cntr/assoc/elem in site names", ch, len(d), len(d))
    b = d.address; d["address"] = std_address(d.address)
    log_step(ds, "Address standardisation", "Removed punctuation/trailing spaces; N/S/E/W -> north/south/east/west; st/ave/blvd/rd... -> full suffixes", changed(b, d.address), len(d), len(d))
    b = d.phone; ph = d.phone.dropna().astype("int64").astype(str).reindex(d.index)
    d["phone"] = S(ph).where(S(ph).str.len().isin([7, 10]))
    b2 = d.zip; z = d.zip.dropna().astype("int64").astype(str).reindex(d.index)
    d["zip"] = S(z).where(S(z).str.fullmatch(r"\d{5}", na=False))
    inv = int((b.notna() & d.phone.isna()).sum() + (b2.notna() & d.zip.isna()).sum())
    log_step(ds, "Phone/ZIP repair", f"float -> digit strings; phone must be 7/10 digits, ZIP 5 digits; {inv} invalid values -> NA", inv, len(d), len(d))
    if "funded_enrollment" in d.columns: d["funded_enrollment"] = pd.to_numeric(d.funded_enrollment, errors="coerce").astype("Int64")
    nb = len(d); sub = [c for c in d.columns if c != "id"]
    d = d[~d.duplicated(subset=sub, keep="first")]
    log_step(ds, "Exact duplicate removal", "Removed rows identical on all attributes (same source re-scraped)", 0, nb, len(d))
    d["street_number"] = S(d.address).str.extract(r"^(\d+)")[0].astype("string")
    d["name_token_count"] = S(d.site_name).str.split().str.len().astype("Int8")
    d["block_key"] = (d.street_number + "_" + S(d.address).str.replace(r"^\d+\s+(north|south|east|west)?\s*", "", regex=True).str[:4]).astype("string")
    d["n_missing_core"] = n_missing(d, ["site_name", "address", "zip", "phone"])
    log_step(ds, "Feature engineering", "Added street_number, name_token_count, block_key (house no. + street prefix), n_missing_core", 0, len(d), len(d))
    d = d.rename(columns={"id": "record_id"}); d["record_id"] = "chi_" + S(d.record_id)
    TIMING[ds] = time.time() - t
    return d.reset_index(drop=True)

# =====================================================================================
# D. Synthetic enterprise stress-test (1.01M)
# =====================================================================================
def clean_synth(df):
    ds = "Synthetic Enterprise 1M"; n0 = len(df); t = time.time()
    d = df.copy()
    txt = [c for c in d.columns if c not in ("record_id", "entity_id")]
    ch = 0
    for c in txt:
        b = d[c]; d[c] = placeholders_to_na(d[c]); ch += changed(b, d[c])
    log_step(ds, "Placeholder -> NA", "Disguised missing values ('', N/A, NULL, none, unknown, -, ?) converted to NA", ch, len(d), len(d))
    nb = len(d); d = d[~d.duplicated(keep="first")]
    log_step(ds, "Exact duplicate rows", "Removed rows identical in every column, including record_id (file re-ingested twice)", 0, nb, len(d))
    ch = 0
    for c in ["first_name", "last_name", "city"]:
        b = d[c]; d[c] = norm_text(d[c]); ch += changed(b, d[c])
    log_step(ds, "Name/city normalisation", "Trim padding, lower-case, strip punctuation/accents", ch, len(d), len(d))
    b = d.gender; g = S(d.gender).str.strip().str.lower().map({"m": "male", "male": "male", "f": "female", "female": "female"}).astype("string")
    d["gender"] = g; log_step(ds, "Category harmonisation", "M/m/Male/MALE -> male ; F/f/Female/FEMALE -> female", changed(b, d.gender), len(d), len(d))
    iso, year, st = parse_dates(d.dob); b = d.dob; d["dob"] = iso; d["dob_year"] = year
    iso2, _, st2 = parse_dates(d.customer_since); d["customer_since"] = iso2
    log_step(ds, "Date harmonisation", "Four DOB formats (ISO, DD/MM/YYYY, MM-DD-YYYY, YYYYMMDD) -> ISO 8601", changed(b, d.dob) + changed(df.loc[d.index, "customer_since"], d.customer_since), len(d), len(d))
    b = d.phone; p = S(d.phone).str.replace(r"\D", "", regex=True)
    p = p.where(~((p.str.len() == 11) & p.str.startswith("1")), p.str[1:])
    d["phone"] = p.where(p.str.len() == 10).mask(d.phone.isna())
    log_step(ds, "Phone normalisation", "Stripped (), -, spaces, +1 country code -> 10-digit string", changed(b, d.phone), len(d), len(d))
    b = d.email; e = S(d.email).str.strip().str.lower()
    d["email"] = e.where(e.str.fullmatch(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", na=False))
    d["email_domain"] = S(d.email).str.split("@").str[1]
    log_step(ds, "Email validation", "Lower-case + RFC-style syntax check; derived email_domain", changed(b, d.email), len(d), len(d))
    b = d.street; d["street"] = std_address(d.street)
    log_step(ds, "Address standardisation", "Expanded St/Ave/Rd/Dr/Apt/Ste; lower-case; punctuation removed", changed(b, d.street), len(d), len(d))
    for c in ["state", "country"]: d[c] = S(d[c]).str.strip().str.upper()
    d["postcode"] = S(d.postcode).str.strip()
    bal = pd.to_numeric(d.account_balance, errors="coerce"); rs = pd.to_numeric(d.risk_score, errors="coerce")
    bad_b = (bal < 0).sum(); bad_r = ((rs < 0) | (rs > 100)).sum()
    d["account_balance"] = bal.mask(bal < 0); d["risk_score"] = rs.mask((rs < 0) | (rs > 100)).astype("Int16")
    log_step(ds, "Outlier / sentinel removal", f"account_balance = -999999 sentinel ({bad_b:,}) and risk_score outside [0,100] ({bad_r:,}) -> NA", bad_b + bad_r, len(d), len(d))
    d["last_soundex"] = soundex(d.last_name); d["first_initial"] = S(d.first_name).str[0]
    d["high_risk_country"] = d.country.isin(["IR", "KP", "MM"]).astype("int8")
    d["log_balance"] = np.log1p(d.account_balance).round(4)
    d["block_key"] = (d.last_soundex + "_" + S(d.dob_year)).astype("string")
    core = ["first_name", "last_name", "dob", "street", "postcode", "email", "phone"]
    d["n_missing_core"] = n_missing(d, core)
    log_step(ds, "Feature engineering", "Added dob_year, last_soundex, first_initial, high_risk_country, log_balance, block_key, n_missing_core", 0, len(d), len(d))
    d["entity_id"] = "syn_" + S(d.entity_id)
    TIMING[ds] = time.time() - t
    return d.reset_index(drop=True)

if __name__ == "__main__":
    out = {}
    out["hist"] = clean_hist(raw["historical_figures_50k"]); print("hist", out["hist"].shape, f"{TIMING['Historical Figures']:.1f}s")
    out["febrl"] = clean_febrl(raw); print("febrl", out["febrl"].shape)
    out["chi"] = clean_chicago(raw["chicago_providers"]); print("chi", out["chi"].shape)
    out["syn"] = clean_synth(raw["synthetic_enterprise_1M"]); print("syn", out["syn"].shape, f"{TIMING['Synthetic Enterprise 1M']:.1f}s")

    # ---------- unified master (real-world data only) ----------
    h, f, c = out["hist"], out["febrl"], out["chi"]
    M = lambda **k: pd.DataFrame(k)
    mh = M(record_id=h.record_id, dataset="historical_figures", source="wikidata_50k", entity_kind="person", entity_id=h.entity_id,
           full_name=h.full_name, first_name=h.first_name, surname=h.surname, gender=h.gender, dob=h.dob, dob_year=h.dob_year,
           birth_place=h.birth_place, occupation=h.occupation, address=pd.NA, city=pd.NA, state=pd.NA, postcode=h.postcode, phone=pd.NA, national_id=pd.NA,
           surname_soundex=h.surname_soundex, block_key=h.block_key, n_missing_core=h.n_missing_core)
    mf = M(record_id=f.record_id, dataset="febrl", source=f.febrl_set, entity_kind="person", entity_id=f.entity_id,
           full_name=f.full_name, first_name=f.given_name, surname=f.surname, gender=pd.NA, dob=f.dob, dob_year=f.dob_year,
           birth_place=pd.NA, occupation=pd.NA, address=f.address, city=f.suburb, state=f.state, postcode=f.postcode, phone=pd.NA, national_id=f.soc_sec_id,
           surname_soundex=f.surname_soundex, block_key=f.block_key, n_missing_core=f.n_missing_core)
    mc = M(record_id=c.record_id, dataset="chicago_providers", source=c.source, entity_kind="organisation", entity_id=pd.NA,
           full_name=c.site_name, first_name=pd.NA, surname=pd.NA, gender=pd.NA, dob=pd.NA, dob_year=pd.NA,
           birth_place=pd.NA, occupation=pd.NA, address=c.address, city="chicago", state="IL", postcode=c.zip, phone=c.phone, national_id=pd.NA,
           surname_soundex=pd.NA, block_key=c.block_key, n_missing_core=c.n_missing_core)
    master = pd.concat([mh, mf, mc], ignore_index=True)
    master["dob_year"] = master.dob_year.astype("Int64")
    for k, v in {"cleaned_historical_figures.csv": h, "cleaned_febrl.csv": f, "cleaned_chicago_providers.csv": c, "cleaned_orion_er_master.csv": master}.items():
        v.to_csv(PROC/k, index=False)
    t = time.time(); out["syn"].to_csv(PROC/"cleaned_synthetic_enterprise_1M.csv.gz", index=False, compression="gzip"); print("gz write", f"{time.time()-t:.0f}s")
    pd.DataFrame(STEPS).to_csv(LOGS/"preprocessing_steps.csv", index=False)
    prof = {k: profile(v) for k, v in {**out, "master": master}.items()}
    (LOGS/"profile_clean.json").write_text(json.dumps(prof, indent=1)); (LOGS/"timing.json").write_text(json.dumps(TIMING))
    print("master", master.shape, "| total cleaned real:", len(master), "| synthetic:", len(out["syn"]))
    print(pd.DataFrame(STEPS)[["dataset", "step", "cells_changed", "rows_before", "rows_after"]].to_string())
