# Deployment

Planned CI/CD flow for the Raspberry Pi, based on the "CI/CD for Raspberry Pi deploys" item in [backlog.md](../backlog.md). Not implemented yet; today every step after the push is manual over SSH.

## Topology

```mermaid
flowchart LR
    Dev([Developer]) -- "push / PR" --> GH[GitHub repo<br/>public]
    GH -- "ci.yml<br/>ubuntu-latest" --> CI[Cloud CI<br/>npm install, triage, test]
    CI -- "required status check" --> GH
    Dev -- "workflow_dispatch<br/>main only" --> Deploy[deploy.yml]
    GH --> Deploy
    Deploy -- "self-hosted runner<br/>same user as PM2" --> Runner

    subgraph Pi["Raspberry Pi (LAN)"]
        Runner[Actions runner<br/>remote trigger only]
        Clone["Existing clone<br/>data/data.db, server/.env,<br/>node_modules"]
        PM2[PM2]
        App["ziber<br/>npm start :3000"]
        Tunnel["tunnel<br/>ngrok"]
        Runner -- "cd into clone" --> Clone
        PM2 --> App
        PM2 --> Tunnel
        App --- Clone
    end

    Tunnel --> Discord[(Discord interactions)]
    LAN([Household on LAN]) --> App
```

## Deploy workflow

```mermaid
flowchart TD
    Start([workflow_dispatch on main]) --> Green{CI green on<br/>this commit?}
    Green -- no --> Abort([Abort])
    Green -- yes --> Snap["1. Pre-deploy DB snapshot<br/>node server/dist/db/backup.js<br/>(SQLite backup API, keep last N)"]
    Snap --> Pull["2. git pull --ff-only origin main"]
    Pull --> Lock{package-lock.json<br/>changed?}
    Lock -- yes --> Install["3. npm install<br/>(never npm ci)"]
    Install --> Binding{better-sqlite3<br/>binding loads?}
    Binding -- no --> Fail
    Binding -- yes --> Build
    Lock -- no --> Build["4. npm run build"]
    Build -- fails --> Fail([Fail loudly<br/>running app untouched])
    Build -- ok --> Restart["5. pm2 restart ziber --update-env<br/>pm2 save"]
    Restart --> Verify{"6. curl -f localhost:3000/<br/>ziber online, restart count<br/>unchanged after few seconds?"}
    Verify -- yes --> Done([Deploy complete])
    Verify -- no --> Fail2([Fail loudly<br/>manual rollback])
```

## Manual rollback (no auto-rollback in v1)

```mermaid
flowchart LR
    A[git checkout previous-sha] --> B[npm run build]
    B --> C{Migration ran<br/>in failed deploy?}
    C -- yes --> D[Restore pre-deploy<br/>DB snapshot]
    C -- no --> E
    D --> E[pm2 restart ziber]
```

## Guardrails

- `ci.yml` never uses `self-hosted`; only `deploy.yml` does, and only via `workflow_dispatch` (public repo, fork PRs must not reach the Pi).
- Restart with `pm2 restart`, never `pm2 start` from another path (wrong `cwd` silently creates an empty DB).
- Avoid deploying around 08:00 (in-process reminder cron has no catch-up); restart drops in-memory participant pickers and undo tokens.
- The `tunnel` process is unaffected by deploys.
- Manual SSH deploy remains available as a fallback.
