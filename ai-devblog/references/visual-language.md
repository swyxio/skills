# Blog visual language

Use this reference for article-specific diagrams, generated imagery, hybrid
visuals, and visual review. It records the preferred house style and gives
copyable examples; adapt topology and labels to the article rather than using
the examples as decorative templates.

## Contents

- [Choose the production sequence](#choose-the-production-sequence)
- [Use the house style](#use-the-house-style)
- [Organize before styling](#organize-before-styling)
- [Canonical examples](#canonical-examples)
- [Review the result](#review-the-result)

## Choose the production sequence

Choose by the truth the visual must preserve:

| Article need | Start with | Optional second pass | Final form |
| --- | --- | --- | --- |
| Architecture, authority, ownership, data flow | Deterministic diagram | Image generation for composition or texture studies | SVG, HTML, Mermaid, or deterministic overlay |
| Sequence, state, incident, migration | Deterministic diagram | Usually none | Timeline, swimlane, sequence, or state diagram |
| Measurements or evidence | Source data or authentic screenshot | Never use generated pixels as evidence | Chart, table, annotated screenshot, or diff |
| Editorial metaphor, atmosphere, hero, or social card | Image generation | Add exact type or branding deterministically | Generated or composited image |
| Technical concept that should feel editorial | Exact diagram | Image generation from the diagram as art direction | Verified hybrid with exact labels restored |

Use this default order:

1. State the exact question the visual must answer.
2. If labels, topology, scale, chronology, or evidence carry the answer, make the
   deterministic visual first. Use `visualize:visualize` for an in-conversation
   study when useful; build the publishable result in site-native code.
3. If mood, metaphor, or publication identity carries the answer, begin with
   `imagegen` studies.
4. For a hybrid, give the deterministic source to image generation, choose a
   visual direction, then restore exact labels, topology, scales, and evidence
   in a deterministic layer.
5. Compare the final output against the source of truth at rendered size.

## Use the house style

Prefer semantic pastel technical diagrams:

- top-down reading order for authority and delivery flows;
- left-to-right reading order for time, sequence, and before/after comparison;
- one dominant path, with branches and exceptions visually subordinate;
- generous whitespace, short centered labels, dark readable text, thin borders,
  and restrained curved connectors;
- color assigned by role, never by box identity;
- containers only for real ownership, trust, runtime, or phase boundaries;
- labeled arrows when the relationship or transition is not obvious;
- minimal crossings; change layout or add lanes before accepting tangled edges;
- no gradients, decorative shadows, oversized titles, dashboard chrome, or a
  rainbow of peer nodes.

Use this semantic palette as the default starting point:

| Meaning | Fill | Border | Typical use |
| --- | --- | --- | --- |
| Neutral input/context | `#F7F7F5` | `#C9CDD2` | PR, user, external context |
| Deterministic control/data | `#CFE5FB` | `#2F7ED8` | routers, plans, artifacts, receipts |
| Standing owner/executor | `#DDF4D2` | `#4F9A51` | managers, workers, services |
| Analysis/ambiguity | `#FFE7B2` | `#C88419` | LLM input, review, uncertainty |
| Coordination/composition | `#E5D6FF` | `#8B5CC7` | coordinators, joins, fan-in |
| Production mutation/outcome | `#FFD5D5` | `#D84B4B` | deployer, traffic, rollback, live result |
| Text and connectors | none | `#5E646B` | arrows and structural lines |

Color must remain redundant with labels, position, line style, or shape. Adapt
tokens to the destination theme and verify contrast rather than preserving a
hex value that becomes inaccessible.

## Organize before styling

Pick the smallest organization that answers the question:

- **Flowchart:** one-way authority, ownership, or transformation pipeline.
- **Swimlanes:** handoffs among actors or systems over time. This is the default
  for release, incident, and operational stories.
- **Sequence:** exact request/response order, including retries or rejection.
- **State machine:** legal states and transition events; omit implementation
  components unless they cause a transition.
- **System boundaries:** ownership, trust, credential, runtime, or network
  separation. Nest only real boundaries.
- **Before/after:** architectural simplification or changed responsibility. Use
  matched alignment so readers can compare without hunting.

If a diagram needs more than roughly twelve visible nodes, first split it into
an overview and one detail figure. Keep a stable reading axis across both.

## Canonical examples

These are source examples, not screenshots. Preserve their organizational
grammar and semantic color roles while replacing the content with article facts.

### Authority flowchart

Use for a deterministic control path with optional analysis and explicit
production authority.

```mermaid
%%{init: {"flowchart": {"curve": "basis"}, "theme": "base"}}%%
flowchart TB
  PR["Ready PR"] --> ROUTER["Deterministic impact router"]
  LLM["LLM impact analyst"] -. "may widen or flag ambiguity" .-> ROUTER
  GRAPH["Checked-in ownership<br/>and dependency graph"] --> ROUTER
  ROUTER --> PLAN["Signed route plan"]
  PLAN --> EDGE["Standing Edge Manager"]
  PLAN --> ID["Standing Identity Manager"]
  PLAN --> RUNNER["Standing Runner Manager"]
  EDGE --> COMPOSE["Dynamic Composition Coordinator"]
  ID --> COMPOSE
  RUNNER --> COMPOSE
  COMPOSE --> ARTIFACTS["Affected CI and immutable artifacts"]
  ARTIFACTS --> RECEIPT["Composition receipt"]
  RECEIPT --> CAS["Deterministic main CAS"]
  RECEIPT --> DEPLOYER["ProductionDeployer"]
  DEPLOYER --> LIVE["Production manifest and health receipt"]

  classDef neutral fill:#F7F7F5,stroke:#C9CDD2,color:#1E2124;
  classDef control fill:#CFE5FB,stroke:#2F7ED8,color:#1E2124;
  classDef owner fill:#DDF4D2,stroke:#4F9A51,color:#1E2124;
  classDef analysis fill:#FFE7B2,stroke:#C88419,color:#1E2124;
  classDef coordination fill:#E5D6FF,stroke:#8B5CC7,color:#1E2124;
  classDef production fill:#FFD5D5,stroke:#D84B4B,color:#1E2124;
  class PR neutral;
  class ROUTER,GRAPH,PLAN,ARTIFACTS,RECEIPT,CAS control;
  class EDGE,ID,RUNNER owner;
  class LLM analysis;
  class COMPOSE coordination;
  class DEPLOYER,LIVE production;
```

### Release swimlanes

Use for operational handoffs. Align all actors to one time axis and show the
traffic mutation as the last privileged action.

```mermaid
sequenceDiagram
  participant PR as Feature PR
  participant CI as Affected CI
  participant MQ as Merge queue
  participant PD as ProductionDeployer
  participant CF as Provider
  participant WEB as Public health
  PR->>CI: Build and sign affected candidates
  CI-->>MQ: Immutable artifact receipts
  MQ->>PD: Enqueue merged release
  PD->>CF: Activate supporting Workers
  CF-->>PD: Provider receipts
  PD->>CF: CAS-activate edge last
  CF-->>PD: Prior and new provider IDs
  PD->>WEB: Verify health and article route
  WEB-->>PD: Live health receipt
```

### Protocol sequence with rejection

Use when ordering and validation are the mechanism. Show the unhappy path in
the same figure when it explains the contract.

```mermaid
sequenceDiagram
  participant O as Operator
  participant P as Capability proxy
  participant D as Durable candidate model
  participant C as Cloud provider
  O->>P: Upload immutable version
  P->>C: POST version at 0% traffic
  C-->>P: Version ID
  P->>D: Record source and artifact digests
  D-->>P: Candidate uploaded
  P->>C: GET current deployment
  alt deployment unchanged
    P-->>O: Complete durable receipt
  else deployment changed
    P-->>O: Reject activation and preserve receipt
  end
```

### Candidate state machine

Use when legal transitions matter more than component ownership.

```mermaid
stateDiagram-v2
  [*] --> Open
  Open --> Uploaded: one approved version upload
  Open --> Failed: upload or validation fails
  Uploaded --> Uploaded: policy-approved GET or HEAD
  Uploaded --> Enqueued: complete receipt accepted
  Enqueued --> Promoting: fence and generation acquired
  Promoting --> Live: traffic CAS and health pass
  Promoting --> RolledBack: post-traffic health fails
  Failed --> [*]
  RolledBack --> [*]
  Live --> [*]
```

### System and authority boundaries

Use when the story is about credential ownership or trust separation.

```mermaid
flowchart LR
  subgraph DEV["Unprivileged build boundary"]
    SRC["Immutable source"] --> BUILD["Build once"]
    BUILD --> CAND["Signed candidate"]
  end
  subgraph CONTROL["Production control boundary"]
    QUEUE["Durable release job"] --> PD["ProductionDeployer"]
    FENCE["Environment fence and generation"] --> PD
  end
  subgraph PROVIDER["Provider boundary"]
    VERSIONS["Immutable versions"] --> TRAFFIC["Production traffic"]
  end
  CAND --> VERSIONS
  CAND --> QUEUE
  PD --> VERSIONS
  PD -->|"expected-current-provider CAS"| TRAFFIC

  classDef control fill:#CFE5FB,stroke:#2F7ED8,color:#1E2124;
  classDef owner fill:#DDF4D2,stroke:#4F9A51,color:#1E2124;
  classDef production fill:#FFD5D5,stroke:#D84B4B,color:#1E2124;
  class SRC,BUILD,CAND control;
  class QUEUE,FENCE owner;
  class PD,VERSIONS,TRAFFIC production;
```

### Before and after

Use matched columns and a single visual thesis. The reader should understand
the simplification before reading every label.

```mermaid
flowchart LR
  subgraph BEFORE["Before: competing release authority"]
    C1["Controller"] --> EDGE1["Edge activation"]
    R1["Runner"] --> EDGE1
    BG1["Break glass"] --> EDGE1
    C1 --> REBUILD["Production rebuild"]
  end
  subgraph AFTER["After: one promotion path"]
    ART["Signed immutable candidates"] --> PD2["ProductionDeployer"]
    PD2 --> SUPPORT["Supporting Workers"]
    SUPPORT --> EDGE2["Edge last"]
    EDGE2 --> HEALTH["Live health receipt"]
  end

  classDef neutral fill:#F7F7F5,stroke:#C9CDD2,color:#1E2124;
  classDef control fill:#CFE5FB,stroke:#2F7ED8,color:#1E2124;
  classDef production fill:#FFD5D5,stroke:#D84B4B,color:#1E2124;
  class C1,R1,BG1,EDGE1,REBUILD neutral;
  class ART,SUPPORT control;
  class PD2,EDGE2,HEALTH production;
```

## Review the result

At rendered desktop and mobile sizes, verify:

- the answer is visible without reading the surrounding paragraph;
- the dominant path is visually obvious and follows one axis;
- labels are short, legible, and use one term per concept;
- colors preserve the semantic mapping and remain redundant with other cues;
- connectors do not cross labels or imply false sequence or ownership;
- generated passes did not change factual topology, labels, values, or evidence;
- the caption states the figure's claim or question, not merely its contents;
- meaningful alt text or a textual equivalent carries the same conclusion.
