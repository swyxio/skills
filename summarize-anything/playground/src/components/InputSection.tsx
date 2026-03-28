import { useEffect, useState } from "react";

export function InputSection({
  value,
  source,
  onChange,
  onSourceChange,
}: {
  value: string;
  source: "sample" | "custom";
  onChange: (text: string) => void;
  onSourceChange: (s: "sample" | "custom") => void;
}) {
  const [sampleText, setSampleText] = useState("");

  useEffect(() => {
    fetch("/sample-transcript.md")
      .then((r) => r.text())
      .then((t) => {
        setSampleText(t);
        if (source === "sample") onChange(t);
      })
      .catch(() => {});
  }, []);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const tokenEst = Math.round(wordCount * 1.33);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-zinc-400">Input</label>
        <div className="flex gap-1 ml-auto">
          <button
            className={`text-xs px-2 py-0.5 rounded ${source === "sample" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}
            onClick={() => {
              onSourceChange("sample");
              onChange(sampleText);
            }}
          >
            Sample
          </button>
          <button
            className={`text-xs px-2 py-0.5 rounded ${source === "custom" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}
            onClick={() => {
              onSourceChange("custom");
              onChange("");
            }}
          >
            Custom
          </button>
        </div>
      </div>
      <textarea
        className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 resize-none focus:outline-none focus:border-zinc-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste text here..."
      />
      <div className="text-xs text-zinc-600">
        {wordCount.toLocaleString()} words / ~{tokenEst.toLocaleString()} tokens
      </div>
    </div>
  );
}
