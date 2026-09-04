ImagineMed School v29 — persistent results + evolving ranking

WHAT CHANGED
1. Every completed mock is saved locally by test_id in My IMAT Progress.
2. When Mock #2/#3 replaces test-data.js, earlier scores remain visible on the same browser.
3. A completed current mock gets a View my previous result button.
4. Saved results can refresh the current ranking without retaking the test.
5. Live ranking uses a Netlify Function + Netlify Blobs.
6. Real ranking records are tagged internally as record_type=real_user/source=live_submission.
7. The 33 initial benchmark scores remain separate internal seed data and are never written as real Netlify submissions.
8. Retakes overwrite the ranking record for the same participant_id + test_id, so one browser profile counts once in the leaderboard. Netlify Forms can still retain all attempts for analytics.

IMPORTANT DEPLOYMENT CHANGE
The static drag-and-drop deploy used for v28 does not deploy the new serverless function reliably. Deploy v29 using Netlify CLI or connect the project to Git.

NETLIFY CLI (one-time setup)
- Install Node.js if needed.
- In this folder run: npm install
- Install/login Netlify CLI: npm install -g netlify-cli ; netlify login
- Link to the EXISTING site: netlify link
- Deploy: netlify deploy --prod --dir=. --functions=netlify/functions

WEEKLY MOCK FLOW
For Mock #2/#3, keep the same project and stable URL. Replace test-data.js with the next mock (with a new meta.id such as imat-mock-02) and redeploy. Stored browser history for prior test IDs stays intact.
