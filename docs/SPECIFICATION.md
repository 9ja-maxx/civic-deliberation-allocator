# Civic Deliberation Allocator — Architectural Specification

## 1. Executive Summary & Problem Thesis

Modern governance faces a crisis of representation in public hearings and deliberative citizen assemblies. When an inquiry or regulatory hearing convenes to evaluate complex public issues (e.g., environmental standards, urban zoning, artificial intelligence oversight), the number of citizen submissions and expert testimonies vastly exceeds the finite number of available oral testimony slots.

Historically, administrative staff or agency organizers unilaterally cherry-pick which citizens are invited to testify. This creates an irreconcilable conflict of interest:
- **Ideological Filtering:** Organizers naturally favor testimonies that confirm agency biases or suppress politically inconvenient dissent.
- **Astroturfing & Template Flooding:** Coordinated special-interest campaigns flood hearings with near-identical duplicate arguments to manufacture the illusion of overwhelming consensus.
- **Evidence Drift:** Citations and sources referenced in testimonies can change or disappear without a cryptographic audit trail.

**Civic Deliberation Allocator** solves this problem by using GenLayer's decentralized AI consensus to replace administrative discretion with mathematical neutrality, cryptographic immutability, and representative viewpoint sortition.

---

## 2. Core Protocol Boundaries & Ingestion Trust Model

### A. Dual Ingestion with Anti-Censorship Receipts
To overcome the vulnerability where an organizer omits opposing viewpoints before locking the docket, the protocol implements **Admission Receipts**:
1. Every admitted citizen testimony is bound to:
   $$\text{Receipt} = \text{SHA256}(\text{docket\_id} \parallel \text{testimony\_id} \parallel \text{source\_url} \parallel \text{content\_digest} \parallel \text{registrar})$$
2. In addition to administrative docket enrollment, citizens can submit cryptographically verifiable enrollment requests.
3. The organizer must commit an `expected_manifest_digest` before enrollment begins. At lock time, the contract verifies exact parity between the accumulated canonical manifest and the expected digest. If an organizer attempts to silently omit or modify testimonies, the manifest digest will fail to match, preventing the docket from locking.
4. If an admission batch is tainted, an explicit recovery path (`annul_docket`) allows cancelling the docket before lock, requiring a new transparent manifest.

### B. Evidentiary Contestation & Integrity Checks
Civic Deliberation Allocator provides robust on-chain dispute arbitration:
- Any participant can dispute a testimony during the contestation window by specifying:
  - `CONTESTATION_PROVENANCE`: Source URL content digest no longer matches the committed SHA-256 hash.
  - `CONTESTATION_DUPLICATE`: Two distinct testimonies represent semantic duplicates or astroturfed template spam.
- GenLayer validators adjudicate the dispute via Dragon consensus:
  - If **ACCEPTED**: The offending testimony is disqualified (`eligible = False`), docket revision increments, and the contract re-clusters and re-sorts remaining testimonies.
  - If **REJECTED**: The challenge is dismissed, maintaining the empanelled delegate distribution.

---

## 3. Formal 6-State Lifecycle

```
[ STATE_ENROLLING ]
         │  (enroll_testimony: validate URLs, digests, deduplicate)
         ▼
[ STATE_MANIFEST_LOCKED ]
         │  (commit_and_lock_manifest: verify computed == expected manifest SHA-256)
         ▼
[ STATE_THEMATIC_CONSENSUS ]
         │  (cluster_testimonies: gl.nondet.web.render + LLM partition equivalence)
         ▼
[ STATE_SORTITION_ALLOCATED ]
         │  (allocate_sortition_delegates: coverage-first diversity allocation)
         ▼
[ STATE_CONTESTATION_OPEN ]
         │  (open_contestation & resolve_contestation: consensus dispute adjudication)
         ▼
[ STATE_SOVEREIGN_RATIFIED ]
            (ratify_docket: immutable finality after challenge deadline)
```

---

## 4. Multi-Metric Equivalence Principle

In non-deterministic clustering, relying on LLM cluster names or arbitrary cluster IDs produces brittle consensus. The protocol's Equivalence Principle validator checks:
1. **Source Evidence Ingestion:** Re-renders all source URLs and asserts SHA-256 hash equality against committed records.
2. **Semantic Partition Equivalence (`cluster_members`):**
   $$\forall i, j \in \text{Testimonies}, \quad \text{Cluster}(i) = \text{Cluster}(j) \iff \text{Cluster}_{\text{val}}(i) = \text{Cluster}_{\text{val}}(j)$$
3. **Relevance Tolerance:** $|\text{Score}_{\text{leader}} - \text{Score}_{\text{val}}| \le 10$.
4. **Delegate Parity:**
   $$\text{Delegates}_{\text{leader}} \equiv \text{Delegates}_{\text{validator}}$$

Consensus confirms that the identical citizen delegates are selected and that arguments are mapped into identical equivalence classes, irrespective of cosmetic phrasing differences.
