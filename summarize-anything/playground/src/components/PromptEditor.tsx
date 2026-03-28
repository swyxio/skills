import { PROMPTS } from "../prompts";

export function PromptEditor({
  format,
  value,
  onChange,
  onReset,
}: {
  format: string;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 pb-2 shrink-0">
        <span className="text-xs font-medium text-zinc-400">
          System Prompt — {PROMPTS[format]?.name ?? format}
        </span>
        <button
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
      <textarea
        className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 leading-relaxed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
