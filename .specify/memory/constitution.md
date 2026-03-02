<!--
═══════════════════════════════════════════════════════════════════════════════
SYNC IMPACT REPORT
Constitution Amendment: v1.0.0 → v1.1.0
Generated: 2026-03-02
═══════════════════════════════════════════════════════════════════════════════

VERSION CHANGE:
- Old: N/A (template only)
- New: 1.1.0
- Bump Rationale: MINOR version - added new principle (Principle V) without removing
  or redefining existing principles. First complete ratification from template.

PRINCIPLES MODIFIED:
- None (all principles newly defined from template)

PRINCIPLES ADDED:
- Principle V: Sensitive Data Handling (NON-NEGOTIABLE)
  * Addresses operational security for customer data from internal APIs
  * Prohibits logging of customer names, project details, financial information
  * Requires generic error messages (no customer identifiers in errors)
  * Mandates redaction patterns: log request IDs + timestamps, not customer data
  * Exempts `backend/src/data/users.json` as sole permitted real-data file

PRINCIPLES REMOVED:
- None

SECTIONS ADDED:
- Principle V with comprehensive implementation examples
- Governance section with amendment process
- Enforcement and compliance expectations

TEMPLATE UPDATES (✅ = updated / ⚠ = requires manual follow-up):
✅ .specify/templates/plan-template.md
   - Updated Constitution Check section with concrete 5-principle gate table
   - Added post-design re-check reminder
   
✅ .specify/templates/tasks-template.md
   - Added Principle V reminders to logging-related tasks (T008, T017)
   - Ensures future task generation includes compliance guidance
   
✅ .specify/templates/spec-template.md
   - No changes needed (spec-template is already technology-agnostic)
   - Future consideration: add HTML comment for logging best practices

⚠ .specify/templates/checklist-template.md
   - PENDING: May benefit from Principle V validation checklist item
   
⚠ .specify/templates/agent-file-template.md
   - PENDING: No immediate update required; monitor for future needs

EXISTING CODEBASE COMPLIANCE:
⚠ Principle I (Documentation Privacy) - PARTIALLY COMPLIANT
   - Specs 004, 005, 006: ✅ Fully sanitized
   - Spec 003: ⚠ Partially sanitized (TEST_RESULTS.md, VALIDATION_REPORT.md, tasks.md need work)
   
⚠ Principle V (Sensitive Data Handling) - AUDIT PENDING
   - No codebase audit performed yet
   - Recommendation: Search for console.log/logger patterns in:
     * backend/src/services/*.ts
     * backend/src/controllers/*.ts
     * backend/src/middleware/logger.ts
   - Verify no customer data exposed in error messages

FOLLOW-UP TODOS:
1. Complete Principle I remediation for spec 003 remaining files
2. Audit existing logging code for Principle V violations
3. Consider adding Principle V checklist item to checklist-template.md
4. Document redaction helper functions if logging infrastructure needs refactoring

SUGGESTED COMMIT MESSAGE:
docs: amend constitution to v1.1.0 (add Principle V: Sensitive Data Handling)

- Add NON-NEGOTIABLE Principle V covering operational security
- Prohibit logging customer data, financial info, project details
- Update plan-template.md with 5-principle Constitution Check table
- Update tasks-template.md with logging compliance reminders
- Establish amendment process and versioning policy
═══════════════════════════════════════════════════════════════════════════════
-->

# Ziber Systems Project Constitution

## Core Principles

### Principle I: Documentation Privacy (NON-NEGOTIABLE)

**Rule**: All versioned documentation, specifications, code comments, mock data, and test fixtures MUST use canonical aliases instead of real business entity names, employee names, or identifying information.

**Rationale**: Version-controlled files are permanent records. Real business names, customer identities, and employee information create audit trails that cannot be retracted. Using canonical aliases from day one prevents accidental exposure of sensitive relationships and protects both the organization and its clients.

**Implementation**:
- Real company name → "Consultant AB"
- Real API/service names → "Consultant API" 
- Real employee identifiers in examples → Role-based descriptions (e.g., "the test user (Senior Developer)" instead of initials)
- Real email domains in code → "consultant.local"
- Real API endpoint paths in specs → Descriptive aliases (e.g., "Consultant API time endpoint")

**Exemption**: `backend/src/data/users.json` is `.gitignore`'d and is the ONLY file where real production data is permitted.

---

### Principle II: Spec-Driven Development

**Rule**: Every feature MUST have a complete specification (`spec.md`) approved before implementation begins. Specifications define user stories, requirements, success criteria, and edge cases—not implementation details.

**Rationale**: Specifications force clarity of purpose before code is written, reducing rework and ensuring features solve real user problems. They serve as contracts between stakeholders and developers.

**Implementation**:
- Use `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement` workflow
- Specifications are technology-agnostic—no mention of frameworks, libraries, or implementation patterns
- Each user story must be independently testable and deliver value on its own
- Acceptance scenarios written before any code

---

### Principle III: No Accidental Dependencies

**Rule**: New npm packages, frameworks, or external services require explicit justification in the implementation plan. Prefer built-in language features and existing dependencies.

**Rationale**: Every dependency is a maintenance burden, security surface, and potential breaking change. Accidental dependencies accumulate technical debt faster than deliberate architecture decisions.

**Implementation**:
- Document in `plan.md` why a new dependency is necessary and what alternatives were considered
- Prefer: Standard library → Existing project dependencies → New lightweight library → Complex framework
- Lock versions with exact semver (`"1.2.3"` not `"^1.2.3"`)

---

### Principle IV: Frontend Data Derivation

**Rule**: Frontend components MUST derive calculated data from API responses rather than requesting pre-calculated values from dedicated backend endpoints, unless there is a clear performance or security requirement.

**Rationale**: Calculation on the frontend keeps the backend thin and focused on data retrieval. It reduces backend API surface area and places business logic close to where it's displayed, improving debuggability.

**Implementation**:
- Margin calculations, date math, filtering, sorting → Frontend utilities
- Backend provides raw data (time entries, user records, rates)
- Exceptions require justification in `plan.md` (e.g., "aggregation over 100k records requires server-side processing")

---

### Principle V: Sensitive Data Handling (NON-NEGOTIABLE)

**Rule**: Customer data, time entries, financial information, and other sensitive data returned from internal APIs MUST NOT be logged to console, persisted in browser storage, or embedded in error messages sent to monitoring systems. When debugging requires inspecting such data, use canonical aliases or redacted representations.

**Rationale**: Internal APIs often return customer information, project details, and financial data that are confidential. Logging this data creates security vulnerabilities, compliance risks, and potential data breaches. Even development/staging logs can be inadvertently exposed.

**Implementation**:
- Logger functions MUST NOT log request/response bodies containing customer data
- Error messages MUST use generic descriptions: "Failed to fetch time entries" not "Failed to fetch time entries for customer Acme Corp (ID: 12345)"
- Browser devtools/console.log MAY display raw data during active development, but MUST NOT persist it
- Mock/test data in version control uses aliases per Principle I
- If logging is required for debugging, log only: request IDs, timestamps, HTTP status codes, error types—never customer names, project names, or financial figures
- `backend/src/data/users.json` is the only file permitted to contain real customer/user data and MUST be in `.gitignore`

**Example - Forbidden**:
```typescript
console.log('Time entries:', timeEntries); // Contains customer names
logger.error('Sync failed for Acme Corp', error);
```

**Example - Allowed**:
```typescript
console.log('Time entries count:', timeEntries.length);
logger.error('Sync failed for customer', { customerId: 'REDACTED', errorType: error.name });
```

---

## Governance

**Authority**: This constitution is binding for all project work. Violations must be corrected before merge.

**Amendment Process**:
1. Propose amendment with rationale in team discussion
2. Update version: MAJOR for removing/redefining principles, MINOR for new principles, PATCH for clarifications
3. Update all affected templates (`.specify/templates/*.md`)
4. Audit existing codebase for compliance if retrospective enforcement is required

**Enforcement**:
- All feature specifications MUST include a "Constitution Check" section verifying compliance
- All implementation plans MUST document exceptions with justification
- Code reviews MUST verify adherence to all NON-NEGOTIABLE principles

**Version**: 1.1.0 | **Ratified**: 2026-03-02 | **Last Amended**: 2026-03-02
