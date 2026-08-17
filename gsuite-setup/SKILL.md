---
name: gsuite-setup
description: Configure or audit Google Workspace (formerly G Suite) organization settings for open collaboration, user autonomy, external sharing, Groups privacy, Gmail delegation, Calendar, Meet, Chat, Drive, Directory, and profile editing. Use for new Workspace setup, restrictive-default cleanup, onboarding a small collaborative organization, or verifying that the Latent Space openness baseline remains applied.
---

# G Suite Setup

Configure Google Workspace through the authenticated Admin Console while changing only settings that differ from the requested baseline.

## Required workflow

1. Use the user's authenticated Chrome session. If Chrome automation is blocked by browser UI, use the Computer Use skill to dismiss or work around the obstruction without leaving Chrome.
2. Verify the active Google account, organization, and organizational unit before editing. For Latent Space, target the root `Latent Space` organizational unit unless the user specifies a narrower scope.
3. Read [references/openness-baseline.md](references/openness-baseline.md) before auditing or applying the baseline.
4. Inspect each relevant setting before editing. Skip settings already matching the baseline and report them separately from actual changes.
5. Apply one coherent product area at a time and wait for Google's saved confirmation before moving on.
6. Re-open or re-snapshot changed sections to verify the persisted state. Treat propagation notices as pending, not proof of immediate user-visible behavior.
7. Report three categories: changed, already correct, and unavailable or per-user-only.

## Safety boundaries

- Never type, request, expose, or store a user's password. Hand password and MFA challenges to the user, then resume after verification.
- Never accept new Terms of Service, legal acknowledgements, paid features, subscriptions, or billing changes without explicit action-time authorization.
- Preserve MFA, spam, malware, phishing, external-recipient warnings, external-participant labels, and administrator safeguards.
- Do not enable paid calling, specialized gateway interoperability, eCDN, device management, or unrelated infrastructure merely in the name of openness.
- Do not infer that `Public on the internet` is desirable for Groups. The baseline keeps membership and conversations private while allowing external senders to email groups whose owners permit it.
- Treat public or external data exposure as a material change. Apply it only when the user's request clearly authorizes that destination and scope.

## Product-specific guidance

- Google labels some saved settings as still propagating. Record the saved state and state the documented delay.
- `Guests can modify event` is a per-user Calendar preference, not an Admin Console domain policy. Set it only for the signed-in user when requested and provide the path for other users.
- Google Meet annotations have no Admin Console switch. Keep presentation available; presenters appoint co-annotators during meetings.
- Prefer owner autonomy over blanket public visibility. In Groups, distinguish external posting, external membership, conversation visibility, and directory visibility; they are separate controls.
- If a requested control is absent from the current Admin Console, verify current official Google documentation before claiming it cannot be configured.

## Completion checklist

- Confirm the exact account, organization, and OU used.
- Confirm every changed setting shows a saved or persisted state.
- Confirm Groups membership and conversations remain private while external inbound email remains permitted.
- List per-user follow-ups, especially Calendar guest modification.
- State any propagation window and any legal or authentication step deliberately left to the user.
