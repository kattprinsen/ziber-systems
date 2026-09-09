# INCIDENT-007 — Production Outage After Native Dependency Reinstall

**Date:** 2026-09-09  
**Status:** Resolved  
**Severity:** High (production application unavailable after deployment)

## Summary

The production application stopped starting during a deployment after the project version was bumped from `1.0.0` to `1.0.1`. The application failed before Hono could start because the native `better-sqlite3` binding was missing on the Raspberry Pi.

The version bump itself was not the cause. Running `npm ci` removed the existing `node_modules` installation and recreated it. During that install, npm blocked dependency install scripts because the packages were not approved through its `allowScripts` configuration. As a result, `better-sqlite3` was present as JavaScript source but its compiled `better_sqlite3.node` binary was never created.

## Impact

- The Ziber production server could not start through PM2 or directly with Node.
- The web application and API were unavailable during the incident.
- Discord reminders and interactions were unavailable while the server was down.
- The SQLite database in `data/` was not deleted or corrupted.

## Root Cause

`better-sqlite3` is a native Node.js dependency. It requires an architecture- and Node-version-specific compiled binding.

The deployment sequence was effectively:

```text
npm version patch
→ git pull on the Raspberry Pi
→ npm ci
→ existing node_modules removed
→ better-sqlite3 install script blocked
→ better_sqlite3.node not created
→ application failed during database initialization
```

The failure was initially obscured because `npm rebuild better-sqlite3` reported success while also warning that install scripts were blocked. The definitive error was:

```text
Error: Could not locate the bindings file
```

The Pi was running Node.js `v22.22.3` on ARM, and rebuilding the native module directly was also vulnerable to SSH disconnects and the resource limits of the Raspberry Pi.

## Recovery

- Approved the `better-sqlite3` install script with npm's `allowScripts` mechanism.
- Rebuilt `better-sqlite3` directly on the Raspberry Pi.
- Verified that the native binding could create an in-memory SQLite database.
- Rebuilt the application and restarted the PM2 process.
- Confirmed the application was running again and the database remained available.

Verification command:

```bash
node -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); db.close(); console.log('better-sqlite3 OK')"
```

## Prevention

- Do not run `npm ci` on the production Pi as a routine step when dependencies have not changed.
- Treat `npm ci` as a full dependency replacement, including native modules such as `better-sqlite3`.
- Keep native dependency install-script approvals in the project deployment setup so a clean install does not silently skip compilation.
- Run dependency installation in a persistent `tmux` session on the Pi, or use a deployment method that survives SSH disconnects.
- Before stopping the running PM2 process, validate the new installation with:

```bash
node -e "const Database=require('better-sqlite3'); new Database(':memory:').close()"
npm run build
```

- Add a deployment smoke test for `/api/health` before switching/restarting the production process.
- Prefer the repository's Docker deployment path for future releases, where native dependencies are compiled in a controlled builder stage.
- Document the difference between `npm version patch` (metadata/version update) and `npm ci` (complete dependency reinstall).

## Notes

- The `1.0.0` to `1.0.1` patch version change did not alter the application dependency graph or directly cause the outage.
- The production SQLite data was stored separately in `data/` and was preserved throughout recovery.
- The incident exposed deployment-process technical debt rather than an application-code defect.
