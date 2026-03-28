import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DiffLine } from "../types";

export function FeedbackSection({
  feedbackText,
  onFeedbackChange,
  onSuggest,
  onAccept,
  onDiscard,
  isSuggesting,
  diffLines,
  previewContent,
  isPreviewLoading,
}: {
  feedbackText: string;
  onFeedbackChange: (t: string) => void;
  onSuggest: () => void;
  onAccept: () => void;
  onDiscard: () => void;
  isSuggesting: boolean;
  diffLines: DiffLine[] | null;
  previewContent: string | null;
  isPreviewLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
      <label className="text-xs font-medium text-zinc-400">Feedback</label>
      <textarea
        className="w-full h-16 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 resize-none focus:outline-none focus:border-zinc-600"
        placeholder='e.g., "too verbose", "missing timestamps", "wrong tone"'
        value={feedbackText}
        onChange={(e) => onFeedbackChange(e.target.value)}
      />
      <button
        className="w-full py-1.5 rounded text-xs font-medium bg-amber-700 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
        onClick={onSuggest}
        disabled={isSuggesting || !feedbackText.trim()}
      >
        {isSuggesting ? "Suggesting..." : "Suggest Prompt Changes"}
      </button>

      {diffLines && (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-400">Proposed Prompt Diff</label>
            <div className="flex gap-2">
              <button
                className="text-xs px-3 py-1 rounded bg-green-700 hover:bg-green-600 transition-colors"
                onClick={onAccept}
              >
                Accept
              </button>
              <button
                className="text-xs px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                onClick={onDiscard}
              >
                Discard
              </button>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono max-h-48 overflow-auto">
            {diffLines.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === "added"
                    ? "diff-added text-green-400"
                    : line.type === "removed"
                    ? "diff-removed text-red-400"
                    : "text-zinc-500"
                }
              >
                <span className="select-none mr-2 text-zinc-700">
                  {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                </span>
                {line.text}
              </div>
            ))}
          </div>

          {/* Preview */}
          <label className="text-xs font-medium text-zinc-400 mt-1">Preview with new prompt</label>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-2 max-h-48 overflow-auto">
            {isPreviewLoading ? (
              <span className="text-xs text-zinc-500 animate-pulse">Generating preview...</span>
            ) : previewContent ? (
              <div className="prose prose-invert prose-sm max-w-none text-xs [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent}</ReactMarkdown>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
