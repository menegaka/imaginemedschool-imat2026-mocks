ImagineMed School — FINAL reviewed build v28

Deploy to Netlify:
1. Upload this folder (or the ZIP contents) so index.html is at the site root.
2. Keep Netlify Form detection enabled.
3. Netlify should detect forms: imat-mock-updates and imat-mock-results.

Reviewed fixes:
- Email opt-in persistence survives Restart Mock on the same browser + same site origin.
- Claude CSS fix retained: emailPanel is hidden with inline display:none !important, overriding the earlier #emailPanel display:flex !important CSS rule.
- Returning subscribed users see a direct See my results button instead of the email prompt.
- Clicking an already-selected answer clears it, allowing a blank response.
- Ranking uses the embedded 33-profile simulated benchmark until a LEADERBOARD_ENDPOINT is configured.
- Ranking displays absolute values rather than user-facing percentages.
- Real Netlify result submissions are explicitly tagged submission_type=real_user.
- benchmark_mode and benchmark_seed_count are included in internal result data. Dummy benchmark profiles remain embedded in the HTML and are not submitted as Netlify users.
- Email form submissions are tagged subscriber_type=real_user.

Important limitation:
Browser-side email persistence cannot carry across a different browser/device, private mode, cleared site storage, or a different domain/origin.

Weekly workflow:
Replace only test-data.js with the next mock data file; keep index.html unchanged unless functionality changes.
