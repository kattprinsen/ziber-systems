# Contract: Dependency bot CI verification

**Feature**: [specs/001-dependabot-ci/spec.md](specs/001-dependabot-ci/spec.md)  
**Plan**: [specs/001-dependabot-ci/plan.md](specs/001-dependabot-ci/plan.md)

This document describes the expected behavior at the integration boundary between the repository hosting platform and the automated verification workflow for dependency bot–created pull requests.

## Events (Inputs)

- **Event**: `dependency_bot_pull_request_opened`
  - **Source**: Automation agent (for example, Dependabot) creating a pull request.
  - **Payload (conceptual)**:
    - `pullRequestId`: Numeric identifier for the pull request.
    - `actor`: Identifier of the automation agent (for example, `dependabot[bot]`).
    - `baseBranch`: Target branch (for example, `main`).
    - `headBranch`: Source branch containing dependency changes.
  - **Effect**: Triggers a new `AutomatedVerificationRun` for the associated `DependencyUpdateProposal`.

- **Event**: `dependency_bot_pull_request_synchronized`
  - **Source**: Automation agent updating the pull request (for example, rebasing or adding new commits).
  - **Payload (conceptual)**:
    - Same as `dependency_bot_pull_request_opened`.
  - **Effect**: Triggers another `AutomatedVerificationRun` for the updated proposal.

- **Event**: `verification_rerun_requested`
  - **Source**: Maintainer manually requesting a re-run of verification checks.
  - **Payload (conceptual)**:
    - `pullRequestId`: Identifier of the pull request.
    - `requestedBy`: Identifier of the maintainer.
  - **Effect**: Triggers a new `AutomatedVerificationRun` linked to the same `DependencyUpdateProposal`.

## Checks (Behavior)

For each triggered `AutomatedVerificationRun`, the workflow MUST perform at least the following logical checks:

1. **Frontend install and lint**
   - Run dependency installation for the frontend.
   - Run linting using the existing frontend lint script.

2. **Frontend tests and build**
   - Run automated tests using the existing frontend test script.
   - Run the frontend build script.

3. **Backend install and lint**
   - Run dependency installation for the backend.
   - Run linting using the existing backend lint script.

4. **Backend tests and build**
   - Run automated tests using the existing backend test script.
   - Run the backend build script.

Each of these logical groups MAY be executed in separate jobs or steps, as long as their aggregate result is reflected in the final status.

## Status Outputs

For each `DependencyUpdateProposal`, the workflow publishes a status back to the pull request:

- **Status**: `queued`
  - Meaning: A verification run has been scheduled but not yet started.
- **Status**: `in_progress`
  - Meaning: At least one verification job is currently running for the proposal.
- **Status**: `passed`
  - Meaning: All required checks (frontend and backend, install + lint + test + build) have completed successfully for the latest run.
- **Status**: `failed`
  - Meaning: At least one required check failed in the latest run.

These statuses are surfaced in the pull request UI and are used by branch protection rules.

## Merge Contract

- A dependency bot–created pull request MUST NOT be merged unless the latest verification status is `passed`.
- While verification status is `queued`, `in_progress`, or `failed`, merge actions MUST be blocked by branch protection configuration.
- Manual override of this rule is outside the scope of this feature and, if allowed by repository settings, should be used only under exceptional circumstances consistent with the specification.
