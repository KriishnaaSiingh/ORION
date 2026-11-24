"""Step 1: persist the Febrl benchmark to disk, load every raw source, and profile it (pre-cleaning)."""
import json, time
from recordlinkage.datasets import load_febrl1, load_febrl2, load_febrl3, load_febrl4
from common import *

# Febrl ships inside the `recordlinkage` package; write raw CSVs (index = rec_id) once
for name, f in [("febrl1", load_febrl1), ("febrl2", load_febrl2), ("febrl3", load_febrl3)]:
    f().reset_index().to_csv(RAW/f"{name}.csv", index=False)
a, b = load_febrl4()
a.reset_index().to_csv(RAW/"febrl4a.csv", index=False); b.reset_index().to_csv(RAW/"febrl4b.csv", index=False)

t = time.time(); raw = load_raw(); print(f"loaded all in {time.time()-t:.1f}s")
prof = {k: profile(v) for k, v in raw.items()}
(LOGS/"profile_raw.json").write_text(json.dumps(prof, indent=1))
tot = sum(p["rows"] for p in prof.values())
for k, p in prof.items(): print(f"{k:28s} rows={p['rows']:>9,}  cols={p['cols']:>3}  mem={p['memory_mb']:>8.1f}MB")
print("TOTAL raw records:", f"{tot:,}")
