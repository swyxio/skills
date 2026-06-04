/**
 * Reference:
 * - functions/api/schedule/version.ts (lightweight poll)
 * - src/api/client.ts (ScheduleApiError + markScheduleStale on 409)
 * - src/frontend/scheduleSync.ts
 * - src/frontend/components/AiebotPanel.tsx ProposalCard.apply
 */

// --- GET /api/schedule/version (not full snapshot) ---

export async function getScheduleVersionHandler(env: Env): Promise<{ version: number }> {
  const version = await db.getScheduleVersion(eventId);
  return { version };
}

// --- API client: never silent on version_conflict ---

export class ScheduleApiError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
  }
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const payload = await response.json();
  if (!response.ok) {
    const code = payload.error?.code ?? 'request_failed';
    const message = payload.error?.message ?? response.statusText;
    if (code === 'version_conflict') markScheduleStale(); // persistent banner
    throw new ScheduleApiError(code, message);
  }
  return payload as T;
}

export function versionConflictMessage(error: unknown, localVersion?: number): string {
  if (!(error instanceof ScheduleApiError) || error.code !== 'version_conflict') {
    return String(error);
  }
  const match = error.message.match(/current version is (\d+)/i);
  const server = match ? Number(match[1]) : null;
  if (localVersion != null && server != null) {
    return `Schedule changed on the server (you have v${localVersion}, server is v${server}). Reload before applying drafts.`;
  }
  return 'Schedule changed while this tab was open. Reload before saving or applying drafts.';
}

// --- Poll every 30s while signed in ---

const POLL_MS = 30_000;
let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startVersionPoll(getLocal: () => { version: number } | null, onStale: () => void): void {
  stopVersionPoll();
  const check = async () => {
    const local = getLocal();
    if (!local) return;
    try {
      const { version } = await fetch('/api/schedule/version').then((r) => r.json());
      if (version !== local.version) onStale();
    } catch { /* best-effort */ }
  };
  void check();
  pollTimer = setInterval(() => void check(), POLL_MS);
}

export function stopVersionPoll(): void {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

// --- Apply draft: catch + inline error (no Uncaught promise) ---

async function applyDraft(proposalId: string, patch: Record<string, unknown>): Promise<void> {
  const localVersion = getSnapshot().version;
  try {
    await apiPost(`/api/proposals/${proposalId}/apply`, {
      expectedVersion: localVersion,
      patch,
      sessionKey: getSessionKey()
    });
    await reloadSnapshot();
  } catch (error) {
    setCardError(versionConflictMessage(error, localVersion));
  }
}

declare type Env = unknown;
declare const db: { getScheduleVersion(id: string): Promise<number> };
declare const eventId: string;
declare function markScheduleStale(): void;
declare function apiPost(path: string, body: unknown): Promise<unknown>;
declare function getSnapshot(): { version: number };
declare function getSessionKey(): string;
declare function reloadSnapshot(): Promise<void>;
declare function setCardError(msg: string): void;
