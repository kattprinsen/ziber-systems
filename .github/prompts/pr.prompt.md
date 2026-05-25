---
agent: 'agent'
description: 'End-of-session: update instructions, save work log, and prepare a PR'
---

This is the end-of-session wrap-up. Execute the following steps in order:

## Step 1 — Update instructions and readme
Follow the instructions in `#prompt:update-instructions.prompt.md` exactly.

## Step 2 — Save work log
Follow the instructions in `#prompt:work-log.prompt.md` exactly.

## Step 3 — Stage all changes
Run `git add -A` to stage everything that was modified or created this session.

## Step 4 — Commit
Using the summary of what was done this session, run `git commit -m "<title>" -m "<body>"` where the title is a short imperative summary (max 72 chars) and the body covers what changed and why.

## Step 5 — Write a PR message
Output the PR message in this format so it is ready to paste into GitHub:

```
TITLE
-----
<same as the commit title>

BODY
----
## What changed
<bullet list of the actual changes — files, features, decisions>

## Why
<one or two sentences on the reason/motivation>

## Notes
<anything a reviewer should know — migrations, seed steps, env vars, etc. Omit if nothing>
```

Do not push. Let the user handle that.
