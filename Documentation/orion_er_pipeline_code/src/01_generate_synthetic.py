"""
Generates the Orion synthetic enterprise-customer stress-test dataset (~1,000,000 records).
Purpose: test pipeline scalability and ER on realistic enterprise noise. Reproducible (seed=42).
`entity_id` is the ground truth: records sharing it belong to the same real-world person.
"""
import numpy as np, pandas as pd, random, time, string
from faker import Faker

SEED = 42
rng = np.random.default_rng(SEED); random.seed(SEED); Faker.seed(SEED)
N_ENTITIES, N_TOTAL = 650_000, 1_000_000
t0 = time.time()

fk = Faker(["en_US", "en_GB", "en_IN", "en_AU"])
first = sorted({fk.first_name() for _ in range(60_000)})
last = sorted({fk.last_name() for _ in range(60_000)})
fk_us = Faker("en_US")
streets = sorted({fk_us.street_address() for _ in range(30_000)})
cities = [(fk_us.city(), fk_us.state_abbr(), fk_us.postcode()) for _ in range(4_000)]
print(f"pools: first={len(first)} last={len(last)} streets={len(streets)}")

countries = ["US","GB","IN","AU","CA","DE","FR","SG","AE","NG","PK","IR","KP","RU","MM"]
c_w = np.array([30,12,12,6,6,5,5,4,4,3,3,2,1,4,3], float); c_w /= c_w.sum()
sources = ["crm","billing","kyc","web_form"]

# ---- 1. base entities (clean "truth")
e = pd.DataFrame({"entity_id": np.arange(N_ENTITIES)})
e["first_name"] = rng.choice(first, N_ENTITIES)
e["last_name"] = rng.choice(last, N_ENTITIES)
y = rng.integers(1935, 2006, N_ENTITIES); m = rng.integers(1, 13, N_ENTITIES); d = rng.integers(1, 29, N_ENTITIES)
e["dob"] = [f"{a:04d}-{b:02d}-{c:02d}" for a, b, c in zip(y, m, d)]
e["gender"] = rng.choice(["male","female"], N_ENTITIES)
e["street"] = rng.choice(streets, N_ENTITIES)
ci = rng.integers(0, len(cities), N_ENTITIES)
e["city"] = [cities[i][0] for i in ci]; e["state"] = [cities[i][1] for i in ci]; e["postcode"] = [cities[i][2] for i in ci]
e["country"] = rng.choice(countries, N_ENTITIES, p=c_w)
dom = np.array(["gmail.com","yahoo.com","outlook.com","hotmail.com","company.com","mail.com"])
e["email"] = (e.first_name.str.lower() + "." + e.last_name.str.lower()
              + rng.integers(1, 99, N_ENTITIES).astype(str) + "@" + rng.choice(dom, N_ENTITIES))
e["phone"] = rng.integers(2_000_000_000, 9_999_999_999, N_ENTITIES).astype(str)
e["account_balance"] = np.round(rng.lognormal(8.5, 1.4, N_ENTITIES), 2)
e["risk_score"] = np.clip(np.round(rng.normal(35, 18, N_ENTITIES)), 0, 100).astype(int)
cs = pd.to_datetime("2005-01-01") + pd.to_timedelta(rng.integers(0, 6500, N_ENTITIES), unit="D")
e["customer_since"] = cs.strftime("%Y-%m-%d")

# ---- 2. records = every entity once + sampled duplicate copies
dup_ids = rng.choice(N_ENTITIES, N_TOTAL - N_ENTITIES, replace=True)
recs = pd.concat([e, e.iloc[dup_ids]], ignore_index=True)
isdup = np.array([False] * N_ENTITIES + [True] * (N_TOTAL - N_ENTITIES))
recs["source_system"] = rng.choice(sources, N_TOTAL, p=[.35, .25, .25, .15])
recs.insert(0, "record_id", [f"R{i:07d}" for i in range(N_TOTAL)])

# ---- 3. noise injection
NICK = {"william":"bill","robert":"bob","richard":"dick","james":"jim","michael":"mike","elizabeth":"liz",
        "katherine":"kate","jennifer":"jen","thomas":"tom","charles":"chuck","margaret":"peggy",
        "joseph":"joe","christopher":"chris","daniel":"dan"}
def typo(s):
    if not isinstance(s, str) or len(s) < 3: return s
    i = random.randrange(len(s)); op = random.random()
    if op < .3: return s[:i] + s[i+1:]                                   # deletion
    if op < .6: return s[:i] + random.choice(string.ascii_lowercase) + s[i+1:]  # substitution
    if op < .8 and i < len(s) - 1: return s[:i] + s[i+1] + s[i] + s[i+2:]       # transposition
    return s[:i] + s[i] + s[i:]                                          # duplication
def fmt_dob(s):
    y_, m_, d_ = s.split("-"); r = random.random()
    if r < .55: return s
    if r < .80: return f"{d_}/{m_}/{y_}"
    if r < .93: return f"{m_}-{d_}-{y_}"
    return f"{y_}{m_}{d_}"
def fmt_phone(p):
    r = random.random()
    if r < .4: return p
    if r < .65: return f"({p[:3]}) {p[3:6]}-{p[6:]}"
    if r < .85: return f"{p[:3]}-{p[3:6]}-{p[6:]}"
    return f"+1 {p[:3]} {p[3:6]} {p[6:]}"
ABBR = [(" Street"," St"),(" Avenue"," Ave"),(" Road"," Rd"),(" Drive"," Dr"),(" Apartment"," Apt"),(" Suite"," Ste")]
def messy_addr(a):
    for full, ab in ABBR:
        if random.random() < .4: a = a.replace(full, ab)
    return a.lower() if random.random() < .3 else a
PLACE = ["", "N/A", "n/a", "unknown", "NULL", "none", "-", "?"]

fn, ln, dobs, em, ph, st, pc = (recs[c].to_numpy(dtype=object) for c in
                                ["first_name","last_name","dob","email","phone","street","postcode"])
r = rng.random((N_TOTAL, 9))
for i in range(N_TOTAL):
    p = .55 if isdup[i] else .12           # duplicate copies are far noisier than originals
    if r[i,0] < p*.45: fn[i] = typo(fn[i])
    elif r[i,0] < p*.65: fn[i] = NICK.get(fn[i].lower(), fn[i])
    if r[i,1] < p*.40: ln[i] = typo(ln[i])
    dobs[i] = random.choice(PLACE) if r[i,2] < p*.10 else fmt_dob(dobs[i])
    if r[i,3] < p*.35: em[i] = typo(em[i]) if random.random() < .5 else random.choice(PLACE)
    ph[i] = random.choice(PLACE) if r[i,4] < p*.20 else fmt_phone(ph[i])
    st[i] = random.choice(PLACE) if r[i,5] < p*.15 else messy_addr(st[i])
    if r[i,6] < p*.12: pc[i] = random.choice(PLACE)
    if r[i,7] < .20: fn[i] = fn[i].upper() if random.random() < .5 else " " + fn[i] + "  "
    if r[i,8] < .10: ln[i] = ln[i].upper()
recs["first_name"], recs["last_name"], recs["dob"], recs["email"] = fn, ln, dobs, em
recs["phone"], recs["street"], recs["postcode"] = ph, st, pc

# ---- 4. enterprise data-quality defects
bad = rng.random(N_TOTAL)
recs.loc[bad < .004, "account_balance"] = -999999.0           # sentinel value
recs.loc[(bad >= .004) & (bad < .007), "risk_score"] = 999    # out-of-range sentinel
g = recs.gender.to_numpy(dtype=object)
mask = rng.random(N_TOTAL) < .30                              # inconsistent coding
alt = {"male": ["M","m","Male","MALE"], "female": ["F","f","Female","FEMALE"]}
g[mask] = [random.choice(alt[x]) for x in g[mask]]
recs["gender"] = g
recs.loc[rng.random(N_TOTAL) < .05, "customer_since"] = None
recs.loc[rng.random(N_TOTAL) < .02, "city"] = None

# ---- 5. ~1% exact duplicate rows (file re-ingested twice)
exact = recs.sample(frac=.01, random_state=SEED)
recs = pd.concat([recs, exact], ignore_index=True).sample(frac=1, random_state=SEED).reset_index(drop=True)
recs.to_csv("data/raw/synthetic_enterprise_customers_1M.csv", index=False)
print(recs.shape, f"{time.time()-t0:.0f}s")
