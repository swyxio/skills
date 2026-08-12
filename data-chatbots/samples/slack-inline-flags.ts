/**
 * Illustrative Slack adapter control parser.
 *
 * Parse adapter controls into structured, authorized options before calling the
 * shared orchestration core. The planner receives clean text, never raw flags.
 * Companion prose: ../slack-surface.md
 */

type PlannerMode = 'hot' | 'advanced' | 'audit';

type ModelOption = {
  slug: string;
  label: string;
  allowedModes: PlannerMode[];
};

const MODEL_OPTIONS: ModelOption[] = [
  { slug: 'fast', label: 'Fast', allowedModes: ['hot', 'advanced', 'audit'] },
  { slug: 'strong', label: 'Strong', allowedModes: ['hot', 'advanced', 'audit'] }
];

type ParsedControls = {
  cleanText: string;
  help: boolean;
  mode: PlannerMode;
  requestedModelSlug?: string;
  auditWindow?: string;
  mine: boolean;
  verbose: boolean;
  notices: string[];
};

const FLAG = /(^|\s)!(help|advanced|audit|mine|verbose|model)\b/i;
const AUDIT_WINDOW = /^(?:\d{1,3})(?:m|h|d|w)$/i;

/**
 * This parser recognizes bounded one-token arguments. Production code should
 * also normalize Slack's rich-text/message representation before parsing.
 */
export function parseSlackControls(rawText: string): ParsedControls {
  const tokens = rawText.trim().split(/\s+/).filter(Boolean);
  const clean: string[] = [];
  const notices: string[] = [];

  let help = false;
  let advanced = false;
  let audit = false;
  let requestedModelSlug: string | undefined;
  let auditWindow: string | undefined;
  let mine = false;
  let verbose = false;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i].toLowerCase();

    if (token === '!help') {
      help = true;
      continue;
    }
    if (token === '!advanced') {
      advanced = true;
      continue;
    }
    if (token === '!mine') {
      mine = true;
      continue;
    }
    if (token === '!verbose') {
      verbose = true;
      continue;
    }
    if (token === '!model') {
      const candidate = tokens[i + 1];
      if (candidate && !candidate.startsWith('!')) {
        requestedModelSlug = candidate.toLowerCase();
        i += 1;
      } else {
        notices.push('!model requires a model slug; using the default.');
      }
      continue;
    }
    if (token === '!audit') {
      audit = true;
      const candidate = tokens[i + 1];
      if (candidate && AUDIT_WINDOW.test(candidate)) {
        auditWindow = candidate.toLowerCase();
        i += 1;
      }
      continue;
    }

    clean.push(tokens[i]);
  }

  // Audit is read-only and wins over a contradictory advanced-write request.
  // A product may reject the combination instead; it must not silently expose
  // both schemas.
  if (audit && advanced) {
    notices.push('Audit mode is read-only; advanced write controls were ignored.');
  }
  const mode: PlannerMode = audit ? 'audit' : advanced ? 'advanced' : 'hot';

  if (!audit && (mine || verbose)) {
    notices.push('!mine and !verbose require !audit.');
    mine = false;
    verbose = false;
  }

  return {
    cleanText: clean.join(' ').trim(),
    help,
    mode,
    requestedModelSlug,
    auditWindow,
    mine,
    verbose,
    notices
  };
}

export function resolveModelSlug(
  requested: string | undefined,
  mode: PlannerMode,
  defaults: Record<PlannerMode, string>
): { slug: string; notice?: string } {
  if (!requested) return { slug: defaults[mode] };
  const option = MODEL_OPTIONS.find((item) => item.slug === requested);
  if (!option || !option.allowedModes.includes(mode)) {
    return { slug: defaults[mode], notice: `Unknown or unavailable model "${requested}"; using the default.` };
  }
  return { slug: option.slug };
}

type SlackActor = {
  userId: string;
  email?: string;
  permissions: Set<'copilot' | 'advanced' | 'audit'>;
};

export async function handleSlackCopilotMessage(rawText: string, actor: SlackActor): Promise<void> {
  const controls = parseSlackControls(rawText);

  if (controls.help || controls.cleanText === '') {
    await postSlackBlocks(buildHelpBlocks(MODEL_OPTIONS));
    return; // Static response: no planner call.
  }

  if (!actor.permissions.has('copilot')) throw new Error('copilot_not_authorized');
  if (controls.mode === 'advanced' && !actor.permissions.has('advanced')) {
    throw new Error('advanced_mode_not_authorized');
  }
  if (controls.mode === 'audit' && !actor.permissions.has('audit')) {
    throw new Error('audit_mode_not_authorized');
  }
  if (controls.mine && !actor.email) throw new Error('audit_actor_unavailable');

  const model = resolveModelSlug(controls.requestedModelSlug, controls.mode, {
    hot: 'fast',
    advanced: 'strong',
    audit: 'fast'
  });

  const historyFilter = controls.mode === 'audit'
    ? {
        after: parseBoundedWindow(controls.auditWindow ?? '24h'),
        actorEmail: controls.mine ? actor.email : undefined,
        verbose: controls.verbose
      }
    : undefined;

  const prefetchedHistory = historyFilter
    ? await loadAuthorizedHistory(actor, historyFilter)
    : undefined;

  const result = await runSharedCopilot({
    actor,
    message: controls.cleanText,
    mode: controls.mode,
    modelSlug: model.slug,
    historyFilter,       // Server-owned; prepend to every history lookup.
    prefetchedHistory
  });

  await postCopilotResult(result, [...controls.notices, ...(model.notice ? [model.notice] : [])]);
}

// Recognized flags can be detected before tokenization for an empty mention,
// but route decisions should use parseSlackControls exactly once.
export const containsInlineControl = (text: string): boolean => FLAG.test(text);

declare function buildHelpBlocks(models: ModelOption[]): unknown[];
declare function postSlackBlocks(blocks: unknown[]): Promise<void>;
declare function parseBoundedWindow(value: string): string;
declare function loadAuthorizedHistory(actor: SlackActor, filter: unknown): Promise<unknown>;
declare function runSharedCopilot(input: unknown): Promise<unknown>;
declare function postCopilotResult(result: unknown, notices: string[]): Promise<void>;
