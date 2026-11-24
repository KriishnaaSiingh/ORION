"use client";

/**
 * Orion Entity Resolution Panel
 * UI for the ML-powered record deduplication and entity matching engine.
 * Connects to the Python ML service on http://localhost:8003
 */

import { useState, useCallback, useRef } from "react";
import { MLModelLab } from "./ml-model-lab";

// ── Types ────────────────────────────────────────────────────
interface Record {
  record_id?: string;
  first_name?: string;
  surname?: string;
  dob?: string;
  dob_year?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface PredictResult {
  is_match: boolean;
  score: number;
  features: Record<string, number>;
  model_version: string;
}

interface TrainingStatus {
  status: "idle" | "queued" | "running" | "done" | "error";
  progress: number;
  message: string;
  metrics?: {
    model_type: string;
    auc_roc: number;
    f1_match: number;
    precision_match: number;
    recall_match: number;
    train_rows: number;
    training_time_s: number;
    dataset_rows: number;
  };
}

interface ModelInfo {
  training_status: TrainingStatus;
  meta: Record<string, unknown>;
  model_exists: boolean;
}

interface BatchResult {
  pair_index: number;
  record_a_id?: string;
  record_b_id?: string;
  score: number;
  is_match: boolean;
}

interface DedupeResult {
  matches: { record_a: number; record_b: number; score: number }[];
  clusters: number[][];
  candidate_pairs_checked: number;
}

// ── Constants ────────────────────────────────────────────────
const ML_API =
  import.meta.env["VITE_ML_API_URL"] ??
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8003"
    : "/api/ml");

const FEATURE_LABELS: Record<string, string> = {
  fn_jw: "First name similarity",
  sn_jw: "Surname similarity",
  fullname_jw: "Full name similarity",
  dob_exact: "DOB exact match",
  year_exact: "Birth year match",
  dob_lev: "DOB closeness",
  postcode_exact: "Postcode exact",
  postcode_lev: "Postcode closeness",
  phone_exact: "Phone exact",
  email_lev: "Email closeness",
  soundex_sn: "Surname phonetic",
  soundex_fn: "First name phonetic",
  address_lev: "Address closeness",
  miss_fn: "First name missing",
  miss_sn: "Surname missing",
  miss_dob: "DOB missing",
  miss_pc: "Postcode missing",
  miss_ph: "Phone missing",
};

// ── API helpers ──────────────────────────────────────────────
async function mlFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const r = await fetch(`${ML_API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `HTTP ${r.status}`);
  }
  return r.json();
}

// ── Empty record helper ──────────────────────────────────────
function emptyRecord(id: string): Record & { record_id: string } {
  return { record_id: id };
}

// ════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    running: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    queued: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    error: "bg-red-500/20 text-red-300 border-red-500/30",
    idle: "bg-white/10 text-white/50 border-white/10",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? map.idle}`}
    >
      {status === "running" && (
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-blue-400" />
      )}
      {status}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    score >= 0.8
      ? "bg-emerald-500"
      : score >= 0.5
        ? "bg-orange-400"
        : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-mono font-semibold text-white">
        {pct}%
      </span>
    </div>
  );
}

function RecordForm({
  value,
  onChange,
  label,
}: {
  value: Record;
  onChange: (r: Record) => void;
  label: string;
}) {
  const field = (
    key: keyof Record,
    placeholder: string,
    type: string = "text"
  ) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
        {placeholder}
      </label>
      <input
        type={type}
        value={(value[key] as string) ?? ""}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        placeholder={placeholder}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
      />
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-orange-400">
        {label}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("first_name", "First Name")}
        {field("surname", "Surname")}
        {field("dob", "Date of Birth", "text")}
        {field("dob_year", "Birth Year")}
        {field("postcode", "Postcode")}
        {field("phone", "Phone")}
        {field("email", "Email", "email")}
        {field("address", "Address")}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Main Panel
// ════════════════════════════════════════════════════════════

export default function EntityResolutionPanel() {
  // ── Model info ──────────────────────────────────────────
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [training, setTraining] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchModelInfo = useCallback(async () => {
    setFetchingInfo(true);
    try {
      const info = await mlFetch<ModelInfo>("/model_info");
      setModelInfo(info);
    } catch (e) {
      setModelInfo(null);
    } finally {
      setFetchingInfo(false);
    }
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      await mlFetch("/train", { method: "POST" });
      // Poll until done
      pollingRef.current = setInterval(async () => {
        const info = await mlFetch<ModelInfo>("/model_info");
        setModelInfo(info);
        if (info.training_status.status === "done" || info.training_status.status === "error") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setTraining(false);
        }
      }, 2000);
    } catch (e) {
      setTraining(false);
    }
  };

  // ── Predict tab ──────────────────────────────────────────
  const [recA, setRecA] = useState<Record>(emptyRecord("RECORD-A"));
  const [recB, setRecB] = useState<Record>(emptyRecord("RECORD-B"));
  const [threshold, setThreshold] = useState(0.5);
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState("");

  const handlePredict = async () => {
    setPredicting(true);
    setPredictError("");
    try {
      const result = await mlFetch<PredictResult>("/predict", {
        method: "POST",
        body: JSON.stringify({ record_a: recA, record_b: recB, threshold }),
      });
      setPredictResult(result);
    } catch (e) {
      setPredictError(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  // ── Deduplicate tab ──────────────────────────────────────
  const [csvText, setCsvText] = useState("");
  const [dedupeThreshold, setDedupeThreshold] = useState(0.5);
  const [dedupeResult, setDedupeResult] = useState<DedupeResult | null>(null);
  const [deduplicating, setDeduplicating] = useState(false);
  const [dedupeError, setDedupeError] = useState("");

  const handleDedupe = async () => {
    setDeduplicating(true);
    setDedupeError("");
    try {
      // Parse simple CSV
      const lines = csvText.trim().split("\n");
      const headers = lines[0]?.split(",").map((h) => h.trim()) ?? [];
      const records = lines.slice(1).map((line, i) => {
        const vals = line.split(",").map((v) => v.trim());
        const rec: Record<string, string> = { record_id: `ROW-${i + 1}` };
        headers.forEach((h, j) => { rec[h] = vals[j] ?? ""; });
        return rec;
      });

      const result = await mlFetch<DedupeResult>(
        `/deduplicate?threshold=${dedupeThreshold}`,
        { method: "POST", body: JSON.stringify(records) }
      );
      setDedupeResult(result);
    } catch (e) {
      setDedupeError(e instanceof Error ? e.message : "Deduplication failed");
    } finally {
      setDeduplicating(false);
    }
  };

  // ── Tab ──────────────────────────────────────────────────
  const [tab, setTab] = useState<"lab" | "model" | "predict" | "dedupe">("lab");

  const tabs = [
    { id: "lab" as const, label: "Teacher Diagnostics & ML Lab" },
    { id: "predict" as const, label: "Predict Match" },
    { id: "dedupe" as const, label: "Deduplicate CSV" },
    { id: "model" as const, label: "Retrain & Model Weights" },
  ];

  return (
    <div className="min-h-screen text-slate-900 dark:text-white p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500 mb-2">
          Orion Intelligence Decision OS
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          ML Entity Resolution & Record Linkage Engine
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Supervised Machine Learning pipeline for multi-source entity deduplication, identity resolution, and graph linkage.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-1.5 backdrop-blur-xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[140px] rounded-lg py-2 px-3 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TEACHER LAB TAB ── */}
      {tab === "lab" && <MLModelLab />}

      {/* ── MODEL TAB ─────────────────────────────────────── */}
      {tab === "model" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  XGBoost Entity Resolution Model
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  Binary classifier trained on 30k+ pairs from the Orion ER
                  master dataset. Compares 18 field-level similarity features.
                </p>
              </div>
              {modelInfo && (
                <StatusBadge
                  status={modelInfo.training_status.status}
                />
              )}
            </div>

            {/* Training progress */}
            {modelInfo && (
              <div className="mt-4 rounded-xl bg-black/30 p-4">
                <p className="text-xs text-white/60 font-mono">
                  {modelInfo.training_status.message}
                </p>
                {modelInfo.training_status.status === "running" && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-orange-500 transition-all duration-500 animate-pulse"
                      style={{
                        width: `${modelInfo.training_status.progress}%`,
                      }}
                    />
                  </div>
                )}

                {/* Metrics */}
                {modelInfo.training_status.metrics && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      {
                        label: "AUC-ROC",
                        value: modelInfo.training_status.metrics.auc_roc,
                      },
                      {
                        label: "F1 Score",
                        value: modelInfo.training_status.metrics.f1_match,
                      },
                      {
                        label: "Precision",
                        value: modelInfo.training_status.metrics.precision_match,
                      },
                      {
                        label: "Recall",
                        value: modelInfo.training_status.metrics.recall_match,
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg bg-white/5 p-3 text-center"
                      >
                        <p className="text-xs text-white/40 uppercase tracking-wider">
                          {m.label}
                        </p>
                        <p className="mt-1 text-xl font-light text-white">
                          {(m.value * 100).toFixed(1)}
                          <span className="text-sm text-white/40">%</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {modelInfo.training_status.metrics && (
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/40">
                    <span>
                      Model:{" "}
                      <span className="text-white/70">
                        {modelInfo.training_status.metrics.model_type}
                      </span>
                    </span>
                    <span>
                      Dataset:{" "}
                      <span className="text-white/70">
                        {modelInfo.training_status.metrics.dataset_rows?.toLocaleString()}{" "}
                        records
                      </span>
                    </span>
                    <span>
                      Train pairs:{" "}
                      <span className="text-white/70">
                        {modelInfo.training_status.metrics.train_rows?.toLocaleString()}
                      </span>
                    </span>
                    <span>
                      Time:{" "}
                      <span className="text-white/70">
                        {modelInfo.training_status.metrics.training_time_s}s
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleTrain}
                disabled={training}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition"
              >
                {training ? "Training…" : "Train Model"}
              </button>
              <button
                onClick={fetchModelInfo}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm text-white/70 transition"
              >
                Refresh Status
              </button>
            </div>
          </div>

          {/* Features explanation */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              18 Comparison Features
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2"
                >
                  <span className="size-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  <span className="text-xs text-white/70">{label}</span>
                  <span className="ml-auto text-[9px] font-mono text-white/30">
                    {key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PREDICT TAB ───────────────────────────────────── */}
      {tab === "predict" && (
        <div className="space-y-4">
          <p className="text-sm text-white/50">
            Enter two records to check whether they refer to the same real-world
            entity.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <RecordForm value={recA} onChange={setRecA} label="Record A" />
            <RecordForm value={recB} onChange={setRecB} label="Record B" />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-xs text-white/50 uppercase tracking-wider">
              Threshold:
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-32 accent-orange-500"
            />
            <span className="font-mono text-sm text-white/70">
              {threshold.toFixed(2)}
            </span>

            <button
              onClick={handlePredict}
              disabled={predicting}
              className="ml-auto rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition"
            >
              {predicting ? "Scoring…" : "Predict Match"}
            </button>
          </div>

          {predictError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {predictError}
            </div>
          )}

          {predictResult && (
            <div
              className={`rounded-2xl border p-6 ${
                predictResult.is_match
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl font-bold ${
                    predictResult.is_match
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-400 border border-red-500/40"
                  }`}
                >
                  {predictResult.is_match ? "MATCH" : "DIFF"}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {predictResult.is_match ? "Match" : "No Match"}
                  </p>
                  <p className="text-xs text-white/50">
                    Model: {predictResult.model_version} · Threshold:{" "}
                    {threshold.toFixed(2)}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-light text-white">
                    {(predictResult.score * 100).toFixed(1)}
                    <span className="text-sm text-white/40">%</span>
                  </p>
                  <p className="text-xs text-white/40">confidence</p>
                </div>
              </div>

              <ScoreBar score={predictResult.score} />

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  Feature Breakdown
                </p>
                <div className="space-y-2">
                  {Object.entries(predictResult.features)
                    .sort(([, a], [, b]) => b - a)
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-36 text-xs text-white/50 truncate">
                          {FEATURE_LABELS[key] ?? key}
                        </span>
                        <div className="flex-1">
                          <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${
                                val > 0.7
                                  ? "bg-emerald-500"
                                  : val > 0.3
                                    ? "bg-orange-400"
                                    : "bg-white/20"
                              }`}
                              style={{ width: `${val * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-10 text-right text-xs font-mono text-white/50">
                          {val.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DEDUPLICATE TAB ───────────────────────────────── */}
      {tab === "dedupe" && (
        <div className="space-y-4">
          <p className="text-sm text-white/50">
            Paste CSV data (with headers) to find duplicate records. The model
            compares pairs within phonetic blocks.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
              CSV Data
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
              placeholder={`first_name,surname,dob,postcode,phone\nJohn,Smith,1990-01-15,SW1A1AA,07700900001\nJon,Smyth,1990-01-15,SW1A 1AA,07700900001\nJane,Doe,1985-06-20,EC1A1BB,07911123456`}
              className="w-full rounded-xl border border-white/10 bg-black/20 p-3 font-mono text-xs text-white/80 placeholder:text-white/20 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/20 resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-xs text-white/50 uppercase tracking-wider">
              Threshold:
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={dedupeThreshold}
              onChange={(e) => setDedupeThreshold(Number(e.target.value))}
              className="w-32 accent-orange-500"
            />
            <span className="font-mono text-sm text-white/70">
              {dedupeThreshold.toFixed(2)}
            </span>

            <button
              onClick={handleDedupe}
              disabled={deduplicating || !csvText.trim()}
              className="ml-auto rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition"
            >
              {deduplicating ? "Processing…" : "Find Duplicates"}
            </button>
          </div>

          {dedupeError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {dedupeError}
            </div>
          )}

          {dedupeResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Duplicate Matches",
                    value: dedupeResult.matches.length,
                    color: "text-orange-400",
                  },
                  {
                    label: "Entity Clusters",
                    value: dedupeResult.clusters.length,
                    color: "text-blue-400",
                  },
                  {
                    label: "Pairs Checked",
                    value: dedupeResult.candidate_pairs_checked,
                    color: "text-white/60",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"
                  >
                    <p className={`text-2xl font-light ${s.color}`}>
                      {s.value.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Duplicate pairs */}
              {dedupeResult.matches.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Duplicate Pairs
                  </h3>
                  <div className="space-y-2">
                    {dedupeResult.matches.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-2.5"
                      >
                        <span className="text-xs font-mono text-orange-300">
                          Row {m.record_a + 1} ↔ Row {m.record_b + 1}
                        </span>
                        <div className="flex-1">
                          <ScoreBar score={m.score} />
                        </div>
                        <span className="text-xs font-mono text-white/50">
                          {(m.score * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clusters */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Entity Clusters
                </h3>
                <div className="space-y-2">
                  {dedupeResult.clusters.map((cluster, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 ${
                        cluster.length > 1
                          ? "bg-orange-500/10 border border-orange-500/20"
                          : "bg-white/5"
                      }`}
                    >
                      <span className="text-xs text-white/40 w-20">
                        Cluster {i + 1}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.map((rowIdx) => (
                          <span
                            key={rowIdx}
                            className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-mono text-white/70"
                          >
                            Row {rowIdx + 1}
                          </span>
                        ))}
                      </div>
                      {cluster.length > 1 && (
                        <span className="ml-auto text-xs text-orange-400 font-semibold">
                          {cluster.length} duplicates
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
