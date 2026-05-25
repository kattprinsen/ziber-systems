DATE      : 2026-05-25
TIME      : ~local session (evening)
PROMPTS   : 20
SESSION   : 002

LOG
---
1.  RPi3 Model B 32-bit OS specs discussed — arm/v7 architecture, 1GB RAM
2.  Decided on non-Docker deployment with pm2 + npm build
3.  Asked about creating a session documentation slash command
4.  Discussed personal artifact / diary concept for session history
5.  Created diary.prompt.md — revised to space log format
6.  Renamed to work-log.prompt.md, first invocation
7.  Created pr.prompt.md — end-of-session wrap-up command
8.  Added git commit step to pr.prompt.md, push left to user
9.  App confirmed running on RPi local network (http://<rpi-ip>:3000)
10. Plants added to app by user and wife via UI
11. pm2 process naming issue — capital Ziber vs lowercase ziber
12. EADDRINUSE crash loop — killed stray process with fuser
13. Discord reminders not firing — missing .env on RPi
14. dotenv loads .env from cwd (project root), not server/.env — fixed in index.ts with explicit path.resolve
15. Copied .env to project root as immediate workaround; code fix committed
16. Discord trigger returned ok:true but no messages — env vars still not loaded until restart with --update-env
17. Reminders confirmed working after env fix
18. Button interactions failing — ngrok not running on Pi
19. Installed ngrok on Pi, started as pm2 process — interactions working
20. Backlog created: rooms/grouping, compact UI, production logging
