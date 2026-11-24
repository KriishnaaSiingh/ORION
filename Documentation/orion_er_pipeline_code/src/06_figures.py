"""Step 5: generate every figure used in the report (all data-driven figures read the real logs / cleaned files)."""
import json, numpy as np, pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle
from common import *

NAVY, TEAL, ORG, GOLD, GREY, RED, LIGHT = "#1F3A5F", "#2A9D8F", "#E76F51", "#E9C46A", "#8D99AE", "#C0392B", "#EEF2F7"
plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False, "axes.spines.right": False, "axes.titleweight": "bold",
                     "axes.titlesize": 11, "axes.labelsize": 9, "xtick.labelsize": 8, "ytick.labelsize": 8, "figure.dpi": 100})
def save(fig, name): fig.savefig(FIGS/f"{name}.png", dpi=180, bbox_inches="tight", facecolor="white"); plt.close(fig); print("saved", name)
def box(ax, x, y, w, h, text, fc=NAVY, tc="white", fs=8, ec=None, bold=True, r=0.02):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0.005,rounding_size={r}", fc=fc, ec=ec or fc, lw=1.2))
    ax.text(x+w/2, y+h/2, text, ha="center", va="center", color=tc, fontsize=fs, fontweight="bold" if bold else "normal", wrap=True)
def arrow(ax, p, q, c=GREY, lw=1.6, style="-|>"):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle=style, mutation_scale=12, color=c, lw=lw))

prof_raw = json.loads((LOGS/"profile_raw.json").read_text()); prof_cl = json.loads((LOGS/"profile_clean.json").read_text())
steps = pd.read_csv(LOGS/"preprocessing_steps.csv"); R = json.loads((LOGS/"stats.json").read_text()); MP = json.loads((LOGS/"multipass_blocking.json").read_text())

# ---------------- F1 architecture
fig, ax = plt.subplots(figsize=(10, 6.2)); ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off")
box(ax, .03, .88, .94, .08, "CLIENT LAYER  -  React: Explorer | Investigation Boards | Ontology Manager | App Builder", NAVY, fs=9)
box(ax, .03, .77, .94, .07, "API GATEWAY  -  Authentication (JWT/OIDC) | Rate limiting | Routing | Audit", "#35577F", fs=9)
box(ax, .03, .47, .30, .26, "", LIGHT, ec=NAVY); ax.text(.18, .70, "CORE PLATFORM", ha="center", fontsize=8, color=NAVY, fontweight="bold")
for i, t in enumerate(["Ontology Service", "Knowledge Graph Service", "Search (Hybrid) Service", "Lineage & Governance"]): box(ax, .05, .62-i*.04-0.0, .26, .033, t, "#35577F", fs=7.5)
box(ax, .36, .47, .30, .26, "", "#FDEDE8", ec=ORG); ax.text(.51, .70, "AI & REASONING (this report)", ha="center", fontsize=8, color=ORG, fontweight="bold")
for i, t in enumerate(["Entity Resolution (ML) *", "Multi-Agent Orchestrator", "Embedding + Model Gateway", "Critic / Verifier + Synthesizer"]): box(ax, .38, .62-i*.04, .26, .033, t, ORG if i == 0 else "#EE8F77", fs=7.3)
box(ax, .69, .47, .28, .26, "", LIGHT, ec=NAVY); ax.text(.83, .70, "APPS & COLLABORATION", ha="center", fontsize=8, color=NAVY, fontweight="bold")
for i, t in enumerate(["Application Builder", "Investigation Boards", "Notifications", "Identity & Tenancy"]): box(ax, .71, .62-i*.04, .24, .033, t, "#35577F", fs=7.5)
box(ax, .03, .27, .94, .15, "", "#E6F4F1", ec=TEAL); ax.text(.5, .395, "INGESTION & PROCESSING  (Kafka event bus)", ha="center", fontsize=8.5, color=TEAL, fontweight="bold")
for i, t in enumerate(["Connectors", "Raw Zone", "Clean & Map *", "Entity Resolution", "Embeddings", "Lineage"]):
    box(ax, .045+i*.155, .29, .14, .07, t, TEAL if i == 2 else "#4DB6A9", fs=7)
    if i: arrow(ax, (.045+i*.155-.015, .325), (.045+i*.155, .325), TEAL)
box(ax, .03, .05, .94, .17, "", "#F4F4F8", ec=GREY); ax.text(.5, .195, "CORE DATA LAYER  (polyglot persistence)", ha="center", fontsize=8.5, color=NAVY, fontweight="bold")
for i, t in enumerate(["PostgreSQL\nontology, users, audit", "Neo4j\nknowledge graph", "Vector DB\nembeddings", "MinIO / S3\nraw files", "Redis\ncache, sessions"]): box(ax, .05+i*.18, .07, .16, .095, t, GREY, fs=7.3)
ax.text(.97, .015, "* = implemented / studied in this progress report", ha="right", fontsize=8, color=ORG, fontweight="bold"); ax.set_title("Figure 1: Orion Intelligence (Cognara) - system architecture", pad=8); save(fig, "fig01_architecture")

# ---------------- F2 ER AI pipeline
fig, ax = plt.subplots(figsize=(10, 3.9)); ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off")
st = [("1. Ingest &\nprofile", TEAL, "DONE"), ("2. Clean &\nstandardise", TEAL, "DONE"), ("3. Blocking\n(candidates)", GOLD, "PREVIEWED"), ("4. Pair\nfeatures", GREY, "NEXT"),
      ("5. ML\nmatcher", GREY, "NEXT"), ("6. Cluster &\ngolden record", GREY, "NEXT"), ("7. Graph +\nlineage", GREY, "LATER")]
w = .118
for i, (t, c, s) in enumerate(st):
    x = .015+i*.1405; box(ax, x, .42, w, .33, t, c, tc="white" if c != GOLD else "black", fs=8)
    ax.text(x+w/2, .33, s, ha="center", fontsize=7, color=c if c not in (GREY, GOLD) else ("#555" if c == GREY else "#B8860B"), fontweight="bold")
    if i: arrow(ax, (x-.022, .585), (x, .585), NAVY)
ax.add_patch(FancyBboxPatch((.008, .27), .39, .62, boxstyle="round,pad=0.005,rounding_size=0.02", fc="none", ec=TEAL, lw=2, ls="--"))
ax.text(.2, .93, "Covered by this progress report", ha="center", fontsize=8.5, color=TEAL, fontweight="bold")
ax.text(.5, .12, "Labelled benchmarks (Febrl, Historical Figures, synthetic 1M) provide ground truth for training and evaluating steps 4-6.", ha="center", fontsize=8, color="#333", style="italic")
ax.set_title("Figure 2: Entity-Resolution AI pipeline and project status", pad=6); save(fig, "fig02_er_pipeline")

# ---------------- F3 knowledge graph example
fig, ax = plt.subplots(figsize=(8.5, 4.6)); ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis("off")
nodes = {"John Smith\n(Person)": (2, 4.4, NAVY), "J. Smith\n(Person)": (2, 1.6, "#6C8EBF"), "Acme Ltd\n(Company)": (5, 5, TEAL), "Acct 4471\n(BankAccount)": (5, 3, GOLD),
         "TX-901\n$48,000": (8.2, 4.3, ORG), "TX-902\n$51,500": (8.2, 1.9, ORG), "Dubai\n(Address)": (5, 0.9, GREY)}
for k, (x, y, c) in nodes.items():
    ax.add_patch(Circle((x, y), .72, fc=c, ec="white", lw=2)); ax.text(x, y, k, ha="center", va="center", fontsize=7.2, color="white" if c != GOLD else "black", fontweight="bold")
def ed(a, b, lab, c=GREY, ls="-"):
    (x1, y1, _), (x2, y2, _) = nodes[a], nodes[b]; arrow(ax, (x1+(x2-x1)*.16, y1+(y2-y1)*.16), (x1+(x2-x1)*.84, y1+(y2-y1)*.84), c)
    ax.text((x1+x2)/2, (y1+y2)/2+.18, lab, fontsize=7, ha="center", color=c, fontweight="bold", bbox=dict(fc="white", ec="none", pad=.5))
ed("John Smith\n(Person)", "Acme Ltd\n(Company)", "WORKS_AT"); ed("John Smith\n(Person)", "Acct 4471\n(BankAccount)", "OWNS"); ed("Acct 4471\n(BankAccount)", "TX-901\n$48,000", "HAS_TX")
ed("Acct 4471\n(BankAccount)", "TX-902\n$51,500", "HAS_TX"); ed("J. Smith\n(Person)", "Dubai\n(Address)", "LOCATED_AT"); ed("J. Smith\n(Person)", "Acct 4471\n(BankAccount)", "OWNS")
arrow(ax, (2, 2.4), (2, 3.65), RED, 2.2, "<|-|>"); ax.text(.1, 3.0, "SAME_AS?\n(Entity Resolution\ndecides)", fontsize=7.5, color=RED, fontweight="bold", ha="left")
ax.set_title("Figure 3: Why entity resolution matters - two records, one real person, one hidden risk pattern", pad=6); save(fig, "fig03_knowledge_graph")

# ---------------- F4 dataset sizes
names = ["Historical Figures (50k)", "Febrl 1-4 (benchmark)", "Chicago providers", "Synthetic enterprise (1M)"]
rows = [prof_raw["historical_figures_50k"]["rows"], sum(prof_raw[k]["rows"] for k in ["febrl1", "febrl2", "febrl3", "febrl4a", "febrl4b"]), prof_raw["chicago_providers"]["rows"], prof_raw["synthetic_enterprise_1M"]["rows"]]
cols = [prof_raw["historical_figures_50k"]["cols"], 11, prof_raw["chicago_providers"]["cols"], prof_raw["synthetic_enterprise_1M"]["cols"]]
fig, ax = plt.subplots(figsize=(8, 3.3)); b = ax.barh(names[::-1], rows[::-1], color=[ORG, GOLD, TEAL, NAVY]); ax.set_xscale("log"); ax.set_xlabel("Raw records (log scale)")
for r_, v, c in zip(b, rows[::-1], cols[::-1]): ax.text(v*1.15, r_.get_y()+r_.get_height()/2, f"{v:,} rows x {c} cols", va="center", fontsize=8)
ax.set_xlim(500, 2e7); ax.set_title(f"Figure 4: Raw data collected - {sum(rows):,} records in total"); save(fig, "fig04_dataset_sizes")

# ---------------- F5 defects found
H = steps.set_index(["dataset", "step"]).cells_changed
hist_dups = 50511-43845; syn_dm = int(H[("Synthetic Enterprise 1M", "Placeholder -> NA")])
d = [("Syn: disguised-missing values", syn_dm, NAVY), ("Syn: inconsistent gender coding", int(H[("Synthetic Enterprise 1M", "Category harmonisation")]), NAVY), ("Syn: exact duplicate rows", 10000, NAVY), ("Syn: sentinel / out-of-range", int(H[("Synthetic Enterprise 1M", "Outlier / sentinel removal")]), NAVY),
     ("Hist: exact duplicate records", hist_dups, ORG), ("Hist: impossible dates", 2696, ORG), ("Hist: invalid postcodes", 496, ORG), ("Hist: day/month swaps repaired", 291, ORG), ("Hist: rows with no name", 67, ORG), ("Hist: invalid gender codes", 30, ORG),
     ("Febrl: invalid state codes", 202, GOLD), ("Febrl: impossible dates", 102, GOLD), ("Febrl: day/month swaps repaired", 10, GOLD), ("Chicago: duplicate rows", 128, TEAL), ("Chicago: sparse columns dropped (>95% NA)", 12, TEAL), ("Chicago: invalid phone/ZIP", 3, TEAL)]
d = sorted(d, key=lambda t: t[1]); fig, ax = plt.subplots(figsize=(8.5, 5.2)); ax.barh([a for a, _, _ in d], [v for _, v, _ in d], color=[c for *_, c in d]); ax.set_xscale("log")
for i, (_, v, _) in enumerate(d): ax.text(v*1.12, i, f"{v:,}", va="center", fontsize=7.5)
ax.set_xlim(1, 3e6); ax.set_xlabel("Affected records / cells (log scale)"); ax.set_title("Figure 5: Data-quality defects detected and fixed during preprocessing"); save(fig, "fig05_defects")

# ---------------- F6 rows before/after
ds = ["Historical Figures", "Febrl Benchmark", "Chicago Providers", "Synthetic Enterprise 1M"]
b4 = [steps[steps.dataset == k].rows_before.iloc[0] for k in ds]; af = [steps[steps.dataset == k].rows_after.iloc[-1] for k in ds]
fig, ax = plt.subplots(figsize=(8, 3.6)); x = np.arange(4); ax.bar(x-.2, b4, .4, label="Before cleaning", color=GREY); ax.bar(x+.2, af, .4, label="After cleaning", color=TEAL); ax.set_yscale("log"); ax.set_xticks(x); ax.set_xticklabels([k.replace(" ", "\n", 1) for k in ds])
for xi, (p, q) in enumerate(zip(b4, af)): ax.text(xi-.2, p*1.1, f"{p:,}", ha="center", fontsize=7); ax.text(xi+.2, q*1.1, f"{q:,}", ha="center", fontsize=7, color=TEAL, fontweight="bold")
ax.set_ylim(1e3, 5e6); ax.set_ylabel("Rows (log scale)"); ax.legend(frameon=False, fontsize=8); ax.set_title("Figure 6: Row counts before vs after preprocessing"); save(fig, "fig06_rows_before_after")

# ---------------- F7 Historical EDA
hist = pd.read_csv(PROC/"cleaned_historical_figures.csv", dtype={"dob_year": "Int64"}, low_memory=False)
fig, axs = plt.subplots(1, 3, figsize=(11, 3.4)); axs[0].hist(hist.dob_year.dropna(), bins=40, color=NAVY); axs[0].set_title("Birth-year distribution"); axs[0].set_xlabel("year")
oc = hist.occupation.value_counts().head(8)[::-1]; axs[1].barh(oc.index, oc.values, color=TEAL); axs[1].set_title("Top 8 occupations")
sz = hist.groupby("entity_id").size(); axs[2].hist(sz, bins=range(1, 23), color=ORG, rwidth=.9); axs[2].set_title("Records per real person"); axs[2].set_xlabel("records in cluster")
fig.suptitle("Figure 7: Historical Figures dataset after cleaning", fontweight="bold", y=1.03); fig.tight_layout(); save(fig, "fig07_hist_eda")

# ---------------- F8 Synthetic EDA
syn = pd.read_csv(PROC/"cleaned_synthetic_enterprise_1M.csv.gz", usecols=["entity_id", "risk_score", "log_balance", "country", "source_system", "high_risk_country", "dob_year", "n_missing_core"])
fig, axs = plt.subplots(2, 2, figsize=(10, 6.2))
axs[0, 0].hist(syn.risk_score.dropna(), bins=50, color=NAVY); axs[0, 0].set_title("Risk score (0-100)")
axs[0, 1].hist(syn.log_balance.dropna(), bins=60, color=TEAL); axs[0, 1].set_title("log(1 + account balance)")
cc = syn.country.value_counts(); axs[1, 0].bar(cc.index, cc.values, color=[RED if c in ("IR", "KP", "MM") else GREY for c in cc.index]); axs[1, 0].set_title("Customers by country (red = high-risk flag)"); axs[1, 0].tick_params(axis="x", rotation=60)
ss = syn.groupby("entity_id").size().value_counts().sort_index().head(8); axs[1, 1].bar(ss.index.astype(str), ss.values, color=ORG); axs[1, 1].set_title("Records per real customer"); axs[1, 1].set_xlabel("records")
fig.suptitle(f"Figure 8: Synthetic enterprise dataset after cleaning ({len(syn):,} records)", fontweight="bold"); fig.tight_layout(); save(fig, "fig08_syn_eda")

# ---------------- F9 missingness before/after
h_raw = {c: v["pct_missing"] for c, v in prof_raw["historical_figures_50k"]["columns"].items()}
h_cl = hist.isna().mean()*100
cmap = {"dob": "dob", "birth_place": "birth_place", "postcode_fake": "postcode", "gender": "gender", "occupation": "occupation", "surname": "surname", "full_name": "full_name", "first_name": "first_name"}
fig, axs = plt.subplots(1, 2, figsize=(11, 4)); keys = list(cmap); x = np.arange(len(keys))
axs[0].bar(x-.2, [h_raw[k] for k in keys], .4, color=GREY, label="Raw"); axs[0].bar(x+.2, [h_cl[cmap[k]] for k in keys], .4, color=TEAL, label="Cleaned"); axs[0].set_xticks(x); axs[0].set_xticklabels([cmap[k] for k in keys], rotation=45, ha="right"); axs[0].set_ylabel("% missing"); axs[0].legend(frameon=False); axs[0].set_title("Historical Figures")
sk = list(R["syn_raw_disguised_missing"]); x2 = np.arange(len(sk))
axs[1].bar(x2-.2, [R["syn_raw_disguised_missing"][k] for k in sk], .4, color=GREY, label="Raw (incl. disguised placeholders)"); axs[1].bar(x2+.2, [R["syn_clean_missing"].get(k, 0) for k in sk], .4, color=TEAL, label="Cleaned (true NA)")
axs[1].set_xticks(x2); axs[1].set_xticklabels(sk, rotation=60, ha="right"); axs[1].legend(frameon=False, fontsize=7); axs[1].set_title("Synthetic enterprise 1M")
fig.suptitle("Figure 9: Missing-value profile before and after preprocessing (cleaning exposes hidden missingness)", fontweight="bold", y=1.02); fig.tight_layout(); save(fig, "fig09_missingness")

# ---------------- F10 Chicago sparsity
cm = pd.Series({c: v["pct_missing"] for c, v in prof_raw["chicago_providers"]["columns"].items()}).sort_values()
fig, ax = plt.subplots(figsize=(8.5, 5.6)); ax.barh(cm.index, cm.values, color=[RED if v > 95 else TEAL for v in cm.values]); ax.axvline(95, color="black", ls="--", lw=1); ax.text(95.5, 1, "95% rule", fontsize=8, rotation=90)
ax.set_xlabel("% missing"); ax.set_title(f"Figure 10: Chicago providers - column sparsity ({int((cm>95).sum())} red columns dropped)"); save(fig, "fig10_chicago_sparsity")

# ---------------- F11 blocking quality
fig, axs = plt.subplots(1, 2, figsize=(10, 3.7)); labs = ["Historical\nFigures", "Febrl", "Synthetic\n1M"]; ks = ["Historical Figures", "Febrl", "Synthetic 1M"]
sing = [R["blocking"][k]["pair_completeness"]*100 for k in ks]; multi = [MP[k]["pair_completeness_union"]*100 for k in ks]; x = np.arange(3)
axs[0].bar(x-.2, sing, .4, color=GREY, label="Single key"); axs[0].bar(x+.2, multi, .4, color=TEAL, label="Multi-pass (5 keys)"); axs[0].set_xticks(x); axs[0].set_xticklabels(labs); axs[0].set_ylim(0, 112); axs[0].set_ylabel("Pair completeness (%)"); axs[0].legend(frameon=False, fontsize=8, loc="upper left")
for xi, (a, b_) in enumerate(zip(sing, multi)): axs[0].text(xi-.2, a+2, f"{a:.1f}", ha="center", fontsize=7.5); axs[0].text(xi+.2, b_+2, f"{b_:.1f}", ha="center", fontsize=7.5, color=TEAL, fontweight="bold")
axs[0].set_title("True duplicate pairs retained")
tp = [MP[k]["candidate_pairs_upper_bound"] for k in ks]; ap = [R["blocking"][k]["total_pairs"] for k in ks]
axs[1].bar(x-.2, ap, .4, color=GREY, label="All pairs (n(n-1)/2)"); axs[1].bar(x+.2, tp, .4, color=ORG, label="Multi-pass candidates"); axs[1].set_yscale("log"); axs[1].set_xticks(x); axs[1].set_xticklabels(labs); axs[1].legend(frameon=False, fontsize=8); axs[1].set_title("Comparisons required (log)")
for xi, (a, b_) in enumerate(zip(ap, tp)): axs[1].text(xi+.2, b_*1.6, f"{(1-b_/a)*100:.3f}%\nreduction", ha="center", fontsize=7)
axs[1].set_ylim(1e4, 3e12); fig.suptitle("Figure 11: Blocking-key quality - the first measurable AI result", fontweight="bold", y=1.03); fig.tight_layout(); save(fig, "fig11_blocking")

# ---------------- F12 preprocessing flow
fig, ax = plt.subplots(figsize=(10, 3.8)); ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off")
fl = ["Load raw\nsources", "Schema\nstandardise", "Placeholders\n-> NA", "Text normalise\n(case, accents)", "Validate &\nrepair dates", "Validate\ncategories/IDs", "Remove\nduplicates", "Engineer\nfeatures", "Validate &\nsave CSV"]
for i, t in enumerate(fl):
    x = .01+i*.109; box(ax, x, .45, .095, .3, t, NAVY if i not in (7, 8) else TEAL, fs=6.8)
    if i: arrow(ax, (x-.014, .6), (x, .6), GREY)
notes = ["parquet / csv", "snake_case, drop\nsparse cols", "'', N/A, NULL,\nunknown, -, ?", "NFKD, lower,\ntrim, punctuation", "4 formats -> ISO\nswap-repair", "gender, state,\npostcode, phone", "exact + sentinel\noutliers", "soundex, blocking\nkeys, n_missing", "13 integrity\nchecks"]
for i, t in enumerate(notes): ax.text(.01+i*.109+.0475, .33, t, ha="center", va="top", fontsize=6.6, color="#333")
ax.set_title("Figure 12: Preprocessing pipeline (implemented in Python / Pandas)", pad=6); save(fig, "fig12_preprocessing_flow")

# ---------------- F13 correlation
syn_n = syn.assign(dup_flag=syn.groupby("entity_id").entity_id.transform("size")).drop(columns=["entity_id", "country", "source_system"])
cor = syn_n.corr(numeric_only=True); fig, ax = plt.subplots(figsize=(6, 4.8)); im = ax.imshow(cor, cmap="RdBu_r", vmin=-1, vmax=1)
ax.set_xticks(range(len(cor))); ax.set_xticklabels(cor.columns, rotation=45, ha="right"); ax.set_yticks(range(len(cor))); ax.set_yticklabels(cor.columns)
for i in range(len(cor)):
    for j in range(len(cor)): ax.text(j, i, f"{cor.iloc[i, j]:.2f}", ha="center", va="center", fontsize=7, color="white" if abs(cor.iloc[i, j]) > .6 else "black")
fig.colorbar(im, shrink=.8); ax.set_title("Figure 13: Correlation of numeric features (synthetic set)"); save(fig, "fig13_correlation")

# ---------------- F14 roadmap
tasks = [("Finish blocking (embedding/ANN pass)", 0, 2, GOLD), ("Pair feature engineering", 1, 3, TEAL), ("Train baselines (LogReg, RF, XGBoost)", 3, 3, TEAL), ("Neural matcher (siamese / transformer)", 5, 3, NAVY),
         ("Clustering + golden record", 7, 2, NAVY), ("Evaluation & error analysis", 8, 2, ORG), ("Neo4j integration + lineage", 9, 2, GREY), ("LLM agents grounded in graph", 10, 3, GREY), ("Final report & demo", 12, 1, RED)]
fig, ax = plt.subplots(figsize=(9, 3.9))
for i, (t, s, d_, c) in enumerate(tasks[::-1]): ax.barh(i, d_, left=s, color=c, height=.55); ax.text(s+d_+.1, i, "", fontsize=7)
ax.set_yticks(range(len(tasks))); ax.set_yticklabels([t for t, *_ in tasks[::-1]], fontsize=8); ax.set_xticks(range(0, 14)); ax.set_xticklabels([f"W{i+1}" for i in range(14)], fontsize=7); ax.grid(axis="x", alpha=.3)
ax.set_title("Figure 14: Planned work after preprocessing (relative weeks)"); save(fig, "fig14_roadmap")
