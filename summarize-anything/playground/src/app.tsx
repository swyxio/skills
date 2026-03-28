import { useState, useCallback } from "react";
import type { RunLog, DiffLine } from "./types";
import { PROMPTS, buildSystemPrompt } from "./prompts";
import { PROVIDERS } from "./providers";
import { computeDiff } from "./diff";
import { TopBar } from "./components/TopBar";
import { InputSection } from "./components/InputSection";
import { ConfigSection } from "./components/ConfigSection";
import { PromptEditor } from "./components/PromptEditor";
import { OutputPanel } from "./components/OutputPanel";
import { FeedbackSection } from "./components/FeedbackSection";

async function callLLM(body: {
  provider: string;
  model: string;
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  maxTokens: number;
  customBaseUrl?: string;
}): Promise<{ content: string; error?: string }> {
  const resp = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function saveRun(run: RunLog) {
  await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(run),
  });
}

export function App() {
  // Input state
  const [inputText, setInputText] = useState("");
  const [inputSource, setInputSource] = useState<"sample" | "custom">("sample");

  // Config state
  const [config, setConfig] = useState({
    format: "youtube_chapters",
    provider: "openai",
    model: "gpt-4.1-mini",
    temperature: 0.3,
    maxTokens: 4096,
    focusDirective: "",
    customBaseUrl: "",
  });

  // Prompt state
  const [currentPrompt, setCurrentPrompt] = useState(
    PROMPTS.youtube_chapters.template
  );
  const [defaultPrompt, setDefaultPrompt] = useState(
    PROMPTS.youtube_chapters.template
  );

  // Output state
  const [output, setOutput] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  // Feedback state
  const [feedbackText, setFeedbackText] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [diffLines, setDiffLines] = useState<DiffLine[] | null>(null);
  const [proposedPrompt, setProposedPrompt] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Handle format change
  const handleFormatChange = useCallback(
    (newConfig: typeof config) => {
      if (newConfig.format !== config.format) {
        const template = PROMPTS[newConfig.format]?.template ?? "";
        const built = buildSystemPrompt(template, newConfig.focusDirective);
        setCurrentPrompt(built);
        setDefaultPrompt(template);
      }
      setConfig(newConfig);
    },
    [config.format]
  );

  // Reset prompt to default template
  const handleResetPrompt = useCallback(() => {
    const built = buildSystemPrompt(defaultPrompt, config.focusDirective);
    setCurrentPrompt(built);
  }, [defaultPrompt, config.focusDirective]);

  // Run the prompt
  const handleRun = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setDiffLines(null);
    setProposedPrompt(null);
    setPreviewContent(null);
    setFeedbackText("");

    const start = Date.now();
    const result = await callLLM({
      provider: config.provider,
      model: config.model,
      systemPrompt: currentPrompt,
      userMessage: inputText,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      customBaseUrl: config.customBaseUrl || undefined,
    });
    const elapsed = Date.now() - start;

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      setOutput(null);
      return;
    }

    setOutput(result.content);
    setDurationMs(elapsed);

    // Save run log
    const run: RunLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      input: {
        text: inputText,
        source: inputSource,
        wordCount: inputText.trim().split(/\s+/).length,
      },
      config: { ...config },
      prompt: {
        system: currentPrompt,
        isModified: currentPrompt !== buildSystemPrompt(defaultPrompt, config.focusDirective),
      },
      output: { content: result.content, durationMs: elapsed },
    };
    setLastRunId(run.id);
    saveRun(run);
  }, [inputText, inputSource, config, currentPrompt, defaultPrompt]);

  // Suggest prompt changes based on feedback
  const handleSuggest = useCallback(async () => {
    if (!feedbackText.trim() || !output) return;
    setIsSuggesting(true);

    const metaPrompt = `You are a prompt engineering assistant. You will be given:
1. The current system prompt
2. A sample of the input text
3. The LLM's output from that prompt
4. The user's feedback on that output

Your job: revise the system prompt to address the feedback.
Return ONLY the revised system prompt — no explanation, no markdown fencing, no preamble.
Keep the same general structure but make targeted changes based on the feedback.`;

    const metaUserMsg = `CURRENT SYSTEM PROMPT:
${currentPrompt}

INPUT TEXT (first 500 words):
${inputText.split(/\s+/).slice(0, 500).join(" ")}

LLM OUTPUT:
${output}

USER FEEDBACK:
${feedbackText}

Produce the revised system prompt now:`;

    const result = await callLLM({
      provider: config.provider,
      model: config.model,
      systemPrompt: metaPrompt,
      userMessage: metaUserMsg,
      temperature: 0.3,
      maxTokens: 2048,
      customBaseUrl: config.customBaseUrl || undefined,
    });

    setIsSuggesting(false);

    if (result.error || !result.content) return;

    const newPrompt = result.content.trim();
    setProposedPrompt(newPrompt);
    setDiffLines(computeDiff(currentPrompt, newPrompt));

    // Fire preview run
    setIsPreviewLoading(true);
    const preview = await callLLM({
      provider: config.provider,
      model: config.model,
      systemPrompt: newPrompt,
      userMessage: inputText,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      customBaseUrl: config.customBaseUrl || undefined,
    });
    setIsPreviewLoading(false);
    setPreviewContent(preview.content ?? null);
  }, [feedbackText, output, currentPrompt, inputText, config]);

  // Accept proposed prompt
  const handleAccept = useCallback(() => {
    if (!proposedPrompt) return;
    setCurrentPrompt(proposedPrompt);
    if (previewContent) {
      setOutput(previewContent);
    }
    setDiffLines(null);
    setProposedPrompt(null);
    setPreviewContent(null);
    setFeedbackText("");
  }, [proposedPrompt, previewContent]);

  // Discard proposed prompt
  const handleDiscard = useCallback(() => {
    setDiffLines(null);
    setProposedPrompt(null);
    setPreviewContent(null);
  }, []);

  // Load a past run
  const handleLoadRun = useCallback(async (id: string) => {
    const resp = await fetch(`/api/runs/${id}`);
    const run: RunLog = await resp.json();
    setInputText(run.input.text);
    setInputSource(run.input.source);
    setConfig(run.config as typeof config);
    setCurrentPrompt(run.prompt.system);
    setOutput(run.output.content);
    setDurationMs(run.output.durationMs);
    setDefaultPrompt(PROMPTS[run.config.format]?.template ?? run.prompt.system);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <TopBar onLoadRun={handleLoadRun} />

      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        <div className="w-[25%] border-r border-zinc-800 p-3 flex flex-col gap-4 overflow-auto">
          <InputSection
            value={inputText}
            source={inputSource}
            onChange={setInputText}
            onSourceChange={setInputSource}
          />
          <ConfigSection
            config={config}
            onChange={handleFormatChange}
            onRun={handleRun}
            isLoading={isLoading}
          />
        </div>

        {/* Center Panel */}
        <div className="w-[40%] border-r border-zinc-800 p-3 flex flex-col min-h-0">
          <PromptEditor
            format={config.format}
            value={currentPrompt}
            onChange={setCurrentPrompt}
            onReset={handleResetPrompt}
          />
        </div>

        {/* Right Panel */}
        <div className="w-[35%] p-3 flex flex-col gap-3 overflow-auto min-h-0">
          {error && (
            <div className="bg-red-950 border border-red-800 rounded p-2 text-xs text-red-300">
              {error}
            </div>
          )}
          <div className="flex-1 min-h-0">
            <OutputPanel
              content={output}
              isLoading={isLoading}
              durationMs={durationMs}
            />
          </div>
          {output && (
            <FeedbackSection
              feedbackText={feedbackText}
              onFeedbackChange={setFeedbackText}
              onSuggest={handleSuggest}
              onAccept={handleAccept}
              onDiscard={handleDiscard}
              isSuggesting={isSuggesting}
              diffLines={diffLines}
              previewContent={previewContent}
              isPreviewLoading={isPreviewLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
