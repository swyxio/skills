import { PROMPTS, FORMAT_IDS } from "../prompts";
import { PROVIDERS } from "../providers";

interface Config {
  format: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  focusDirective: string;
  customBaseUrl: string;
}

export function ConfigSection({
  config,
  onChange,
  onRun,
  isLoading,
}: {
  config: Config;
  onChange: (c: Config) => void;
  onRun: () => void;
  isLoading: boolean;
}) {
  const set = (patch: Partial<Config>) => onChange({ ...config, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium text-zinc-400 block mb-1">Output Format</label>
        <select
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
          value={config.format}
          onChange={(e) => set({ format: e.target.value })}
        >
          {FORMAT_IDS.map((id) => (
            <option key={id} value={id}>
              {PROMPTS[id].name} — {PROMPTS[id].description}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1">Provider</label>
          <select
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
            value={config.provider}
            onChange={(e) => {
              const p = PROVIDERS[e.target.value];
              set({ provider: e.target.value, model: p?.defaultModel ?? "" });
            }}
          >
            {Object.values(PROVIDERS).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1">Model</label>
          <input
            type="text"
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
            value={config.model}
            onChange={(e) => set({ model: e.target.value })}
          />
        </div>
      </div>

      {config.provider === "custom" && (
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1">Base URL</label>
          <input
            type="text"
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
            placeholder="https://api.example.com/v1"
            value={config.customBaseUrl}
            onChange={(e) => set({ customBaseUrl: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1">
            Temperature: {config.temperature.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            className="w-full accent-blue-500"
            value={config.temperature}
            onChange={(e) => set({ temperature: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1">Max Tokens</label>
          <input
            type="number"
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
            value={config.maxTokens}
            onChange={(e) => set({ maxTokens: parseInt(e.target.value) || 4096 })}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-400 block mb-1">Focus Directive</label>
        <input
          type="text"
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
          placeholder='e.g., "focus on the AI aspects"'
          value={config.focusDirective}
          onChange={(e) => set({ focusDirective: e.target.value })}
        />
      </div>

      <button
        className="w-full py-2 rounded font-medium text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
        onClick={onRun}
        disabled={isLoading}
      >
        {isLoading ? "Running..." : "Run"}
      </button>
    </div>
  );
}
