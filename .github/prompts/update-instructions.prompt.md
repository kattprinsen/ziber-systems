---
agent: agent
description: Update copilot-instructions.md and readme.md with new decisions, conventions, or patterns decided in this conversation.
---

Review our conversation and identify any new decisions, conventions, patterns, or tech choices that were made and are not yet reflected in `.github/copilot-instructions.md`.

Then update `.github/copilot-instructions.md` to include them. Follow these rules:
- Only add things that are project-wide and reusable — not one-off task context
- Be concise: bullet points or short sentences, no prose
- Group additions under the most fitting existing section, or create a new section if nothing fits
- Do not remove or rewrite existing content unless it is now incorrect
- Do not add anything that is already covered

Then update `readme.md` to reflect the current state of the project. Follow these rules:
- Keep it practical: what the project does, how to run it, how to seed data, what routes exist
- Update any sections that are now outdated
- Add new features, routes, or scripts that are missing
- Do not add implementation details that belong in `copilot-instructions.md`

After updating both files, briefly list what was added/changed and why.
