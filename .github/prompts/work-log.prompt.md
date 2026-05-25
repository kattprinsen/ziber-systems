---
agent: 'agent'
description: 'Write a work log entry for this session'
---

Look back at this conversation and produce a work log entry, then save it as `logs/SESSION-NNN.md` where NNN is the next sequential number after the highest existing session file in that folder.

Use this format:

```
DATE      : YYYY-MM-DD
TIME      : HH:MM (local)
PROMPTS   : <number of user messages in this session>
SESSION   : NNN

LOG
---
<one line per prompt — the topic or action, not a full transcript>
```

Keep each log line short and factual. No prose, no emotion. Just what was asked and what happened.
