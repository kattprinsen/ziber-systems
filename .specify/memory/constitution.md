<!--
SYNC IMPACT REPORT
==================
Version change: 1.1.0 → 1.2.0
Modified principles:
  - I. Data Privacy & Sensitivity: unchanged
  - II–V: unchanged
Added sections:
  - Core Principles: VI. Test-Gate — Features Are Not Done Until Tests Pass (NON-NEGOTIABLE)
  - Development & Contribution Workflow / Testing Standards: expanded with Definition of Done
  - Code Review Checklist: new test-gate item
  - Governance / Compliance: new test-gate compliance rule
Removed sections: N/A
Templates reviewed:
  - .specify/templates/plan-template.md ✅ (no outdated refs)
  - .specify/templates/spec-template.md ✅ (no outdated refs)
  - .specify/templates/tasks-template.md ✅ (no outdated refs)
  - .specify/templates/commands/: No command files present — N/A
Deferred TODOs: None
-->

# Ziber Consultant Management System Constitution

## Core Principles

### I. Data Privacy & Sensitivity (NON-NEGOTIABLE)

All sensitive data — including individual salaries, salary increases, customer names, billed hours,
customer hours, and any values from which these can be derived — MUST never appear in version
control, application logs, stdout/stderr output, or any artifact outside designated secured paths.

Rules:
- Source Excel files MUST reside in a gitignored input directory (e.g., `data/input/`).
- Extracted JSON stores MUST reside in a gitignored data directory (e.g., `data/store/`).
- Only aggregated, anonymized, or clearly non-sensitive summaries MAY be committed or shared.
- Scripts MUST strip or mask sensitive fields before writing any output intended for display or review.
- The `.gitignore` MUST explicitly cover all data directories and any derivative files.
- Project-specific configuration secrets — including contribution margin targets, salary-cost
  thresholds, billing-rate benchmarks, and any other business parameters that could reveal
  internal strategy — MUST be stored in either:
  - a `.env` file at the project root (gitignored), or
  - a dedicated constants file (e.g., `config/secrets.py` or `config/constants.js`) that is
    explicitly gitignored.
  A `.env.example` or `config/constants.example.*` file with placeholder values (no real data)
  SHOULD be committed to document required keys without leaking values.

**Rationale**: Accidental leakage of salary or customer data exposes the company to legal,
contractual, and reputational risk. This gate is non-negotiable and checked at every PR review.

### II. Extract-Transform-Store Pipeline

Data flows in a single, unidirectional pipeline:

**Excel Source → Extractor → Canonical JSON Store → Analyzer → Report**

Rules:
- Each stage MUST be independently runnable and testable in isolation.
- Extractors produce no side effects beyond writing to the designated store path.
- No stage MAY read from a stage other than its direct predecessor.
- Store schema changes MUST be backward-compatible or explicitly versioned.

**Rationale**: A clear pipeline makes the system auditable, debuggable, and safe to extend
without cascading breakage across stages.

### III. Storage-Agnostic Design (NON-NEGOTIABLE)

All data read/write operations MUST go through a dedicated storage abstraction layer
(e.g., a repository or data-access module). Business logic MUST NOT reference file paths,
directory structures, or collection names directly.

Rules:
- A `StorageProvider` interface (or equivalent) MUST be the sole point of file/collection access.
- JSON and a future NoSQL backend MUST be swappable via configuration, not code changes.
- Integration tests MUST validate the abstraction by running against both the JSON provider
  and a test double to confirm the contract holds.

**Rationale**: Migration from JSON to NoSQL is explicitly anticipated. Any leakage of storage
details into business logic will make that migration costly and error-prone.

### IV. Dual-Scope Analytics (Individual & Group)

Every business metric — contribution margin, salary cost, salary increase, occupation percentage,
and any future metric — MUST be calculable at both the individual consultant level and the
group/team level.

Rules:
- Aggregation logic MUST be shared; no duplication between individual and group calculation paths.
- Reports MUST clearly declare their scope (individual vs. group) in their output.
- Group metrics MUST NOT reveal individual-level sensitive values through back-calculation;
  groups of fewer than 2 consultants MUST be suppressed or anonymized in group reports.

**Rationale**: The business need is explicitly dual-scope. Shared logic prevents calculation
divergence and ensures group rollups remain consistent with individual records.

### V. Idempotent, Script-Driven Processing

All processing happens via scripts. There is no interactive runtime UI.

Rules:
- Every script MUST be idempotent: re-running on the same input MUST produce identical output
  without duplication, corruption, or accumulating side effects.
- Scripts MUST validate input structure before processing and fail fast with a clear, actionable
  error message identifying which file or field is invalid.
- Scripts MUST exit with a non-zero code on any processing failure.
- No script MAY silently swallow errors or continue on partial failures without explicit
  opt-in configuration and a logged warning.

**Rationale**: Manual Excel placement means re-runs are common (e.g., a corrected file replaces
an old one). Idempotency guarantees safety. Fast-fail validation prevents silently corrupt stores.

### VI. Test-Gate — Features Are Not Done Until Tests Pass (NON-NEGOTIABLE)

A feature is only considered complete when its tests are written, run, and pass. No feature
MAY be merged or marked done while any of its tests are failing or absent.

Rules:
- Every new feature MUST include tests covering its acceptance scenarios before merge.
- The full test suite MUST pass before a feature branch is merged into the main branch.
- Tests MUST run against anonymized fixture data — never against real data stores.
- A feature that changes existing behaviour MUST update the affected tests in the same PR;
  disabling or deleting tests to make a build pass is explicitly forbidden.
- Pipeline scripts (extractor, analyzer, reporter) MUST each have at minimum one integration
  test that executes the script end-to-end and asserts on its output.

**Rationale**: Tests are the only objective proof that a feature does what it claims and
does not break what already works. Untested code is unfinished code.

## Data Classification & Access Control

### Sensitive Data (MUST NOT be committed or exposed)

- Individual consultant salaries and salary increase amounts
- Customer names, identifiers, or any customer-attributable data
- Billed hours, customer hours, or any billing-rate-derivable figures
- Individual contribution margins when the group contains only one consultant
- Raw Excel source files and any intermediate extraction artifacts

### Project Configuration Secrets (MUST NOT be committed)

- Contribution margin goals or targets
- Salary cost thresholds or budget caps
- Billing rate benchmarks or internal rate cards
- Any numeric or categorical threshold that could reveal internal business strategy

These values MUST live in a gitignored `.env` file or a gitignored constants file.
A committed `.env.example` / `constants.example.*` with placeholder values SHOULD document
the required keys so new contributors can set up their environment without accessing real data.

### Non-Sensitive Data (MAY be committed for tooling or configuration)

- Aggregated group contribution margins (group size ≥ 2)
- Occupation percentages aggregated at group level
- Script source code, schema definitions, and configuration files
- Sample or anonymized test fixtures containing no real consultant or customer data

### Required Gitignore Coverage

The following MUST always be covered in `.gitignore`:

```
data/input/          # Raw Excel source files
data/store/          # Extracted JSON stores
*.xlsx
*.xls
.env                 # Project-specific secrets and config values
.env.local
.env.*.local
config/secrets.*     # Gitignored constants file (real values)
config/constants.*   # Gitignored constants file (real values)
```

Only the `.example` variants of the above config files MAY be committed.

Any new data directory introduced by future development MUST be added to `.gitignore`
as part of the same PR that introduces the directory.

## Development & Contribution Workflow

### Script Execution Order

1. Place Excel source files in `data/input/` (gitignored).
2. Run the extractor script — produces canonical JSON in `data/store/`.
3. Run analysis scripts against `data/store/` to generate reports.

### Testing Standards

- Unit tests MUST cover extraction logic, metric calculations, and aggregation functions.
- Integration tests MUST validate the full pipeline end-to-end using anonymized fixture data.
- No test fixture MAY contain real salary, customer, or billing data.
- Test coverage MUST include: individual metric calculation, group aggregation, storage
  provider swap (JSON ↔ test double), groups of size 1 (suppression), and missing-month
  edge cases.

### Definition of Done

A feature is done when ALL of the following are true:

1. All acceptance scenarios from the feature spec have corresponding passing tests.
2. The full test suite passes with no skipped or disabled tests introduced by this feature.
3. No test fixture contains real sensitive data.
4. The feature has passed the Code Review Checklist below.

### Code Review Checklist

Before merging any PR, reviewers MUST verify:

- [ ] No sensitive data paths or field names hardcoded in business logic
- [ ] Storage abstraction layer respected — no direct file I/O in analyzers or reporters
- [ ] New metrics implemented at both individual and group scope
- [ ] All scripts remain idempotent
- [ ] `.gitignore` updated if new data directories are introduced
- [ ] No business configuration thresholds (margin goals, salary caps, rate benchmarks) hardcoded
      in committed source files — they MUST reference `.env` or the gitignored constants file
- [ ] `.env.example` / `constants.example.*` updated if new config keys are introduced
- [ ] All tests for this feature are written and pass (Principle VI — Definition of Done)
- [ ] Full test suite passes; no tests disabled or deleted to achieve a green build

## Governance

This Constitution supersedes all other practices, conventions, and guidelines for the
Ziber Consultant Management System. Where conflicts exist, the Constitution takes precedence.

### Amendment Procedure

1. Propose the amendment with a clear rationale explaining the change.
2. Increment the version according to semantic versioning rules:
   - **MAJOR**: Removal or incompatible redefinition of an existing principle.
   - **MINOR**: New principle, section, or materially expanded guidance.
   - **PATCH**: Clarification, wording fix, or non-semantic refinement.
3. Update `LAST_AMENDED_DATE` to the amendment date (ISO format YYYY-MM-DD).
4. Commit with message: `docs: amend constitution to vX.Y.Z (<summary of change>)`
5. Run consistency propagation: verify plan, spec, and tasks templates remain aligned.

### Compliance

- All PRs MUST pass a Data Privacy gate (Principle I) before merge — no exceptions.
- Storage-touching PRs MUST include integration tests validating the abstraction (Principle III).
- Any new metric MUST be implemented at both individual and group scope (Principle IV).
- Script changes MUST be validated for idempotency (Principle V).
- No PR MAY be merged unless the full test suite passes and all feature tests are present (Principle VI).

**Version**: 1.2.0 | **Ratified**: 2026-04-27 | **Last Amended**: 2026-04-27
