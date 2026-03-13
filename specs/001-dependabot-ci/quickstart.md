# Quickstart: Automated validation for dependency updates

**Feature**: [specs/001-dependabot-ci/spec.md](specs/001-dependabot-ci/spec.md)  
**Plan**: [specs/001-dependabot-ci/plan.md](specs/001-dependabot-ci/plan.md)

This quickstart explains how to work with automated verification for dependency bot–created pull requests once the feature is implemented.

## 1. What the automation does

- Detects pull requests created by dependency bots (for example, Dependabot).
- Runs standardized verification for each such PR:
  - Installs dependencies for the frontend and backend.
  - Runs linting, tests, and build for the frontend.
  - Runs linting, tests, and build for the backend.
- Reports results back to the pull request as check statuses.
- Blocks merging of dependency bot PRs while required checks are failing or have not completed.

In the pull request UI, you will typically see two required checks from this workflow:

- `Frontend - lint, test, build`
- `Backend - lint, test, build`

Both checks must report success for a dependency bot pull request to be considered verified.

## 2. Developer workflow for dependency updates

1. Wait for the automation to start on a new dependency bot PR; you should see checks reported as pending.
2. Once the checks complete, review the results:
   - If all required checks are green, proceed with code review and merge.
   - If checks fail, inspect the logs, identify the breaking change, and either adjust the code or update the dependency configuration.
3. If you push new commits to the dependency bot PR (for example, to fix a breaking change), the automation re-runs and updates the status.
4. Do not merge dependency bot PRs while required checks are red or still running.

## 3. Manually running the verification steps locally

To reproduce the verification pipeline locally before pushing changes:

From the repository root:

```sh
# Frontend
npm install
npm run lint
npm test
npm run build

# Backend
cd backend
npm install
npm run lint
npm test
npm run build
```

This sequence mirrors what the automation will run for dependency bot PRs.

## 4. Adjusting or extending checks (maintainers)

- To add or remove checks, update the automation configuration under `.github/workflows/` (for example, to add coverage reporting or additional linters).
- Keep the core guarantees from the specification:
  - Dependency bot PRs must always run a full verification pipeline.
  - Merges of dependency bot PRs must be blocked when required checks are failing or incomplete.
- If new checks significantly increase runtime, revisit performance goals and consider parallelization or caching strategies.

## 5. Merge and protection expectations

- In this repository, automation checks for dependency updates are scoped to dependency bot PRs (for example, Dependabot), but there is **no automatic branch protection rule** that blocks merges based solely on these checks.
- As a policy, maintainers MUST verify that both of the following checks are green before merging any dependency bot PR:
  - `Dependabot CI / Frontend - lint, test, build`
  - `Dependabot CI / Backend - lint, test, build`
- Maintainers should not merge dependency bot PRs while either check is pending or failing; instead, investigate the failure, fix it (or close the PR), and re-run the checks.
