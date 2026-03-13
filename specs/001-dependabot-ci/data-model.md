# Data Model: Automated validation for dependency updates

**Feature**: [specs/001-dependabot-ci/spec.md](specs/001-dependabot-ci/spec.md)  
**Plan**: [specs/001-dependabot-ci/plan.md](specs/001-dependabot-ci/plan.md)

## Entities

### 1. Dependency Update Proposal

Represents a proposed change to one or more dependencies initiated by an automated tool (for example, Dependabot).

**Fields (conceptual)**:
- `id`: Unique identifier of the proposal (for example, pull request number).
- `source`: Automation agent that created the proposal (for example, `dependabot[bot]`).
- `targetBranch`: Branch that the proposal targets (for example, `main`).
- `createdAt`: Timestamp when the proposal was opened.
- `updatedAt`: Timestamp of the latest update (for example, when rebased or synchronized).
- `status`: High-level state of the proposal (for example, `open`, `merged`, `closed`).

**Relationships**:
- Has many `AutomatedVerificationRun` records.
- Has a derived `VerificationStatusIndicator` summarizing verification state.

### 2. Automated Verification Run

Represents a single execution of the standardized verification pipeline for a specific dependency update proposal.

**Fields (conceptual)**:
- `id`: Unique identifier for the verification run (for example, an automation run ID).
- `proposalId`: Identifier of the associated `DependencyUpdateProposal`.
- `triggeredBy`: Cause of the run (for example, `opened`, `synchronize`, `re-run requested`).
- `startedAt`: Timestamp when the run started.
- `completedAt`: Timestamp when the run completed (if applicable).
- `status`: One of `queued`, `in_progress`, `passed`, `failed`, `cancelled`.
- `frontendResult`: Aggregated result of frontend checks (`passed`, `failed`, `skipped`).
- `backendResult`: Aggregated result of backend checks (`passed`, `failed`, `skipped`).
- `durationSeconds`: Derived duration between `startedAt` and `completedAt` when available.

**Relationships**:
- Belongs to a `DependencyUpdateProposal`.

### 3. Verification Status Indicator

Summarizes the current verification state of a dependency update proposal for maintainers.

**Fields (conceptual)**:
- `proposalId`: Identifier of the associated `DependencyUpdateProposal`.
- `overallStatus`: One of `not_started`, `in_progress`, `passed`, `failed`.
- `requiredChecks`: List of required check names included in the standardized pipeline.
- `lastUpdatedAt`: Timestamp when the indicator was last refreshed.

**Derivation Rules**:
- `overallStatus = not_started` when there are no `AutomatedVerificationRun` records.
- `overallStatus = in_progress` when at least one run has `status = in_progress` and none have `status = passed` or `failed` more recently.
- `overallStatus = passed` when the most recent completed run has `status = passed` and all required checks within that run have succeeded.
- `overallStatus = failed` when the most recent completed run has `status = failed` or at least one required check within that run has failed.

## Validation Rules

- A `DependencyUpdateProposal` created by a dependency bot MUST have at least one `AutomatedVerificationRun` before it can transition to a `merged` status.
- For dependency bot proposals, the `overallStatus` for the associated `VerificationStatusIndicator` MUST be `passed` before merges are allowed.
- If the most recent `AutomatedVerificationRun` has `status = failed`, merges MUST be blocked until a new run completes with `status = passed`.
- Verification runs SHOULD complete within a target window (20 minutes) for at least 90% of dependency bot proposals; unusually long durations SHOULD be investigated.

## State Transitions (Conceptual)

- `DependencyUpdateProposal.status`: `open` → `merged` or `closed`.
- `AutomatedVerificationRun.status`: `queued` → `in_progress` → (`passed` | `failed` | `cancelled`).
- `VerificationStatusIndicator.overallStatus` updates as new runs are created and completed according to the derivation rules above.
