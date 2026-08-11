---
name: sync-accelevents
description: Pull Accelevents speaker headshots, social data, bios, and schedule metadata into this project's Europe source data and photo assets. Load for an explicit Accelevents-to-website sync; not for generic image or schedule edits.
---

# Sync Accelevents speaker data

This is a repository-specific data sync. Inspect the current script help and
working tree before running it. The API credential must come from the approved
secret store as `ACCELEVENTS_API_KEY`; never put it in source, command output,
logs, or chat.

## Safe sync sequence

1. Confirm the current branch, clean/dirty state, source-of-truth files, and
   intended scope. Do not silently discard existing work or create a branch
   with a hard-coded name/path.
2. Run the repository's current `sync_accelevents.py --help`. Prefer
   `--dry-run` first, then use the smallest applicable scope (`--headshots-only`
   or `--data-only`) and `--save-snapshot` only when a raw snapshot is desired.
3. The sync may fetch speakers, download/replace headshots, optimize large
   images, fill blank social/bio fields, and write an API snapshot. Review the
   diff and verify that existing nonblank editorial data was not overwritten.
4. Re-export derived schedule data only if the repository workflow requires it.
   Run the current typecheck/build and relevant image or schedule checks.
5. Inspect the final diff for secret leakage, unexpected deletions, broken image
   references, and changes outside the intended Europe source/assets. Commit,
   push, or open a PR only when the user asks or the repository's active
   workflow calls for that handoff.

## Expected data boundaries

Use the repository's current paths for the Europe schedule, public speaker
photos, large/original photos, snapshots, and exports. The script's matching
priority and overwrite behavior are the source of truth; verify them from the
current implementation rather than relying on a historical count or a copied
path. Keep API snapshots and generated exports out of commits when the project
marks them as ignored or ephemeral.

## Focused checks

- Credential is supplied through the secret environment only.
- Dry-run output and the reviewed diff match the requested scope.
- Speaker matching does not silently merge distinct people.
- Existing bio/social/editorial values are preserved unless explicitly changed.
- Image files are readable and references resolve.
- Typecheck/build and the project's relevant preview pass.
