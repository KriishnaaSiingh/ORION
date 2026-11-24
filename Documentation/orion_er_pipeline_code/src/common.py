"""Shared loaders + profiling helpers for the Orion ER (Entity Resolution) data pipeline."""
import json, pandas as pd, numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW, PROC, LOGS, FIGS = ROOT/"data/raw", ROOT/"data/processed", ROOT/"logs", ROOT/"figures"

def load_raw():
    """Returns dict name -> raw DataFrame exactly as loaded from disk."""
    return {
        "historical_figures_50k": pd.read_parquet(RAW/"historical_figures_50k.parquet"),
        "febrl1": pd.read_csv(RAW/"febrl1.csv", dtype=str),
        "febrl2": pd.read_csv(RAW/"febrl2.csv", dtype=str),
        "febrl3": pd.read_csv(RAW/"febrl3.csv", dtype=str),
        "febrl4a": pd.read_csv(RAW/"febrl4a.csv", dtype=str),
        "febrl4b": pd.read_csv(RAW/"febrl4b.csv", dtype=str),
        "chicago_providers": pd.read_csv(RAW/"chicago_providers_messy.csv"),
        "synthetic_enterprise_1M": pd.read_csv(RAW/"synthetic_enterprise_customers_1M.csv", dtype=str, keep_default_na=False, na_values=[]),
    }

def profile(df):
    miss = df.isna().sum()
    return {
        "rows": int(len(df)), "cols": int(df.shape[1]),
        "memory_mb": round(float(df.memory_usage(deep=True).sum())/1e6, 2),
        "columns": {c: {"dtype": str(df[c].dtype), "n_missing": int(miss[c]),
                        "pct_missing": round(100*float(miss[c])/max(len(df),1), 2),
                        "n_unique": int(df[c].nunique(dropna=True))} for c in df.columns},
    }
