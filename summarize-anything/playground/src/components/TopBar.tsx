import { useEffect, useState } from "react";
import type { KeyStatus, RunSummary } from "../types";

export function TopBar({
  onLoadRun,
}: {
  onLoadRun: (id: string) => void;
}) {
  const [keys, setKeys] = useState<KeyStatus>({});
  const [runs, setRuns] = useState<RunSummary[]>([]);

  useEffect(() => {
    fetch("/api/keys").then((r) => r.json()).then(setKeys).catch(() => {});
    fetch("/api/runs").then((r) => r.json()).then(setRuns).catch(() => {});
  }, []);

  const refreshRuns = () => {
    fetch("/api/runs").then((r) => r.json()).then(setRuns).catch(() => {});
  };

  const dot = (status: boolean | "unknown") =>
    status === true ? "bg-green-500" : status === "unknown" ? "bg-yellow-500" : "bg-zinc-600";

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
      <h1 className="text-sm font-semibold tracking-wide text-zinc-300">
        Summarize Playground
      </h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {Object.entries(keys).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1" title={k}>
              <span className={`w-1.5 h-1.5 rounded-full ${dot(v)}`} />
              {k}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <select
            className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onLoadRun(e.target.value);
            }}
            onFocus={refreshRuns}
          >
            <option value="">History ({runs.length} runs)</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.timestamp).toLocaleTimeString()} — {r.format} ({r.model})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
