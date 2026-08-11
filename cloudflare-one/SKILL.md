---
name: cloudflare-one
description: Design, configure, troubleshoot, or review a Cloudflare One deployment involving Access, Gateway, WARP/device client, Tunnel/Mesh/WAN, identity, DLP, CASB, or device posture. Use when Zero Trust policy or private-network connectivity is the task; do not trigger for ordinary Workers, generic VPN advice, or unrelated Cloudflare products.
---

# Cloudflare One

Retrieve current [Cloudflare One documentation](https://developers.cloudflare.com/cloudflare-one/),
API schemas, and exact UI/API references before relying on product names,
selectors, category IDs, limits, or configuration syntax. Treat this skill as a
decision and safety aid, not as an embedded product manual.

## Workflow

1. Classify the task: Access/application authorization, Gateway traffic policy,
   device enrollment/profile, private networking, DLP/CASB, migration, or
   troubleshooting.
2. Resolve the account, users/sites/apps, IdP and SCIM state, device/on-ramp,
   private destinations, routes/DNS, current policy order, and blast radius.
3. Inspect existing resources before proposing a mutation. Do not infer policy,
   route, group, tunnel, or profile state from a dashboard screenshot alone.
4. Retrieve only the docs for the surfaces touched. State prerequisites,
   validation, rollback, and the smallest pilot or disabled/audit-mode rollout
   that reduces the risk.

## Constraints that change the design

- Access authorizes applications; Gateway filters traffic. A requirement can
  need both, but do not substitute one for the other.
- A private Access app needs an appropriate device/on-ramp, route, and DNS
  resolution. Creating an Access application alone does not make a private
  hostname reachable.
- Group selectors depend on the actual IdP claim or SCIM sync. Access Groups
  and synced Gateway identity groups are different objects; verify exact,
  case-sensitive names and account for sync/re-authentication delay.
- A healthy Tunnel only proves the connector reaches Cloudflare. Verify the
  published application/network route, origin reachability, DNS, and policy
  decision on the owning path.
- Device enrollment rules determine who may connect; device profiles determine
  behavior after enrollment. Headless/service-token devices do not acquire
  human group membership automatically.
- Split-tunnel mode is a profile-wide choice. Include routes only the intended
  private destinations; exclude routes everything except deliberate bypasses.
  Align device entries and tunnel routes in both directions and check conflicts
  with other VPN/DNS agents or MDM-managed settings.
- TLS inspection requires planned certificate deployment and Do Not Inspect
  exceptions for pinned or incompatible applications. DLP definitions do
  nothing until referenced by an enforcement surface; stage and tune before
  blocking.
- CASB discovery is not the same as inline enforcement, and remediation may
  belong in the SaaS admin console. Use current product docs for scan cadence
  and supported controls.

## Safety and verification

- Start broad allow/block, TLS, or DLP changes disabled or scoped to named pilot
  users/sites unless the user authorizes a wider blast radius.
- Preserve a known-good policy/route/profile state and a rollback owner before
  enabling a risky change. Do not delete the old path in the same cutover.
- Use Access audit logs, Gateway activity logs, device status, tunnel health,
  DNS resolution, and an authorized end-to-end request to explain a failure.
  Do not treat one green dashboard indicator as proof of access.
- Keep service tokens, private keys, session data, and sensitive traffic out of
  checked-in config, screenshots, prompts, and logs.

When a task crosses into production release, durable execution, migrations, or
live rollout verification, load `cloudflare-production-builder` as the
orchestrator and this skill only for the One-specific surface.
