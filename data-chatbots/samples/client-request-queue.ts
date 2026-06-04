/**
 * Reference: src/frontend/components/AiebotPanel.tsx
 *
 * FIFO client queue: composer never blocks during long agent loops.
 * One stream in flight; follow-ups show "queued" until prior job settles.
 */

type Job = {
  id: string;
  text: string;
  prompt: string;
  images: string[];
  modelSlug: string;
};

// Refs (Preact/React): queueRef, processingRef, abortRef
const queueRef: Job[] = [];
let processingRef = false;
let abortController: AbortController | null = null;

async function processQueue(): Promise<void> {
  if (processingRef) return;
  const job = queueRef.shift();
  if (!job) return;

  processingRef = true;
  markPending(job.id, { startedAt: Date.now(), queued: false });
  abortController = new AbortController();

  try {
    await streamPlanner(job.prompt, { signal: abortController.signal }, {
      onToolCall: (kind, query) => appendTool(job.id, kind, query),
      onAnswerDelta: (text) => appendAnswer(job.id, text),
      onResult: (result) => replaceWithAssistant(job.id, result)
    });
  } catch (error) {
    if (abortController.signal.aborted) {
      removeJobBubbles(job.id);
      restoreComposer(job.text); // Stop mid-flight
    } else {
      showError(job.id, error);
    }
  } finally {
    abortController = null;
    processingRef = false;
    void processQueue(); // drain next queued job
  }
}

function submit(message: string): void {
  const id = makeId();
  appendChat(
    { kind: 'user', text: message, id },
    { kind: 'pending', id, startedAt: 0, queued: true }
  );
  clearComposer();
  queueRef.push({ id, text: message, prompt: buildPrompt(message), images: [], modelSlug: 'default' });
  void processQueue();
}

function cancelJob(id: string): void {
  const entry = findPending(id);
  if (entry && !entry.queued) {
    abortController?.abort(); // active → Stop
  } else {
    queueRef = queueRef.filter((j) => j.id !== id);
    removeJobBubbles(id); // queued → Remove
  }
}

function editUserMessage(index: number): void {
  queueRef.length = 0;
  const active = findActivePending();
  if (active) abortSilently(active.id);
  truncateChatAfter(index);
  restoreComposer(getUserText(index));
}

/** PendingIndicator UI */
function pendingLabel(queued: boolean, startedAt: number, hasAnswer: boolean, stage?: string): string {
  if (queued) return 'queued';
  if (hasAnswer) return 'writing';
  if (stage) return 'thinking';
  return 'thinking';
}
// queued → "Remove"; active → "Stop" + elapsed seconds + tool lines

declare function markPending(id: string, patch: object): void;
declare function streamPlanner(prompt: string, opts: object, handlers: object): Promise<void>;
declare function appendTool(id: string, kind: string, query: string): void;
declare function appendAnswer(id: string, text: string): void;
declare function replaceWithAssistant(id: string, result: unknown): void;
declare function removeJobBubbles(id: string): void;
declare function restoreComposer(text: string): void;
declare function showError(id: string, error: unknown): void;
declare function appendChat(...entries: object[]): void;
declare function clearComposer(): void;
declare function buildPrompt(message: string): string;
declare function makeId(): string;
declare function findPending(id: string): { queued: boolean } | undefined;
declare function findActivePending(): { id: string } | undefined;
declare function abortSilently(id: string): void;
declare function truncateChatAfter(index: number): void;
declare function getUserText(index: number): string;
