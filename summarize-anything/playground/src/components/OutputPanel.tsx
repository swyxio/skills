import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function OutputPanel({
  content,
  isLoading,
  durationMs,
  label,
}: {
  content: string | null;
  isLoading: boolean;
  durationMs?: number;
  label?: string;
}) {
  const copy = () => {
    if (content) navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 pb-2 shrink-0">
        <span className="text-xs font-medium text-zinc-400">
          {label ?? "Output"}
          {durationMs != null && (
            <span className="ml-2 text-zinc-600">{(durationMs / 1000).toFixed(1)}s</span>
          )}
        </span>
        {content && (
          <button
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            onClick={copy}
          >
            Copy
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto bg-zinc-900 border border-zinc-800 rounded p-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="animate-pulse">Generating...</span>
          </div>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs [&_code]:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-xs text-zinc-600 italic">
            Run a prompt to see output here.
          </div>
        )}
      </div>
    </div>
  );
}
