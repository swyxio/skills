---
name: cloudflare-one-migrations
description: Plan or review a migration from Zscaler, Palo Alto, a legacy VPN/SWG/SD-WAN, or another SASE stack to Cloudflare One. Use for source export inventory, policy mapping, parity/gap analysis, and staged rollout; do not trigger for ordinary Cloudflare One configuration or generic network modernization.
---

# Cloudflare One migrations

Retrieve current Cloudflare and source-vendor export documentation before
mapping exact fields. A migration plan is an auditable inventory and staged
decision record, not an automatic policy translation.

## Workflow

1. Identify source products, versions, accounts, environments, exports, logs,
   ownership, compliance needs, and decommission constraints.
2. Request structured exports before mapping. Record missing exports and do not
   treat screenshots or prose summaries as complete source state.
3. Inventory identities/groups, apps/destinations, connectors/tunnels,
   routes/DNS, rules/lists/objects, TLS/DLP/CASB settings, exceptions, hit
   counts, and dependencies.
4. Produce a row-level map: source object, Cloudflare target, prerequisites,
   confidence, supported/partial/unsupported status, manual decision, and
   security impact. Every source rule ends as mapped or explicitly not migrated
   with a reason.
5. Create dependencies in order: identity/SCIM, on-ramps, routes/DNS, lists,
   certificates/bypasses, Access apps/policies, Gateway controls, DLP/CASB,
   logging, and validation.
6. Stage with a migration prefix and disabled/audit rules, pilot users/sites,
   compare logs and real workflows, then expand. Keep the source path until
   the new path and rollback criteria are proven.

## Mapping boundaries

- ZIA/SWG filtering usually maps to Gateway policies/lists, but preserve source
  zones, exceptions, hit data, and ordering rather than flattening rules.
- ZPA/private-app access usually maps to Access application types plus
  Tunnel/device routing and private DNS. Verify app protocol, ports, and
  identity model before choosing a target.
- Palo Alto/Prisma rules require direction, zones, objects, apps, users,
  decryption, and hit counts; do not translate a zone into a list blindly.
- Legacy VPN replacement may require Access, the device client, and Tunnel or
  Mesh. Use Cloudflare WAN only when the requirement is site-to-site/on-ramp
  connectivity and current product support fits.

## Completion proof

Report source coverage, unsupported/partial mappings, identity and routing
prerequisites, pilot results, policy-log parity, rollback owner/path, and the
explicit criteria for decommissioning the source stack. Never claim parity from
matching rule counts alone.
