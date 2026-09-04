ImagineMed School - IMAT 2026 Weekly Mocks - FINAL v40

This is the complete Netlify deployment package for the existing site:
imaginemedschool-imat2026-mocks

Includes:
- index.html (latest v40 UI)
- netlify.toml
- package.json
- netlify/functions/leaderboard.mjs
- Week 1 and Week 2 benchmark seed support
- Netlify Forms for Week 1 and Week 2 results
- existing helper files from the working deployment package

IMPORTANT
Deploy this package to the EXISTING Netlify project. Do not create a new site.
For Functions + Blobs live ranking, deploy using the same Git/CLI method that is already running the leaderboard function in production. A plain drag-and-drop static deploy may not deploy/update functions reliably.

Forms expected after deploy:
- imat-mock-results       (Week 1)
- imat-mock-02-results    (Week 2)
- imat-mock-updates       (shared email opt-in)

Leaderboard:
- imat-mock-01 has its own benchmark + live real submissions
- imat-mock-02 has its own benchmark + live real submissions
