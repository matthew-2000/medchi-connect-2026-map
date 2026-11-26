# Publish the reviewed map to Sites

GitHub stores shared source. Sites hosts the public map. Continue using this existing Site:

- URL: https://medchi-connect-2026-map.m-ercolino.chatgpt.site
- Project ID: `appgprj_6b084ae28d608191ae8f9c822cee390b`
- Audience: public (preserve it)
- Runtime bindings: D1 `DB`, R2 `BUCKET`
- Existing owner configuration: `DATA_APP_OWNER_EMAIL_SHA256` (preserve its value; never commit it)

## Through Codex

The publishing Codex session needs the **Sites** and **Data** plugins and owner/editor access to this Site. GitHub access alone does not grant Sites access. Matteo can publish merged changes from his account. Read the installed `sites:sites` and `data-analytics:publish-artifact-to-sites` skills before publication; use their current scripts and contracts.

1. Pull the reviewed `main` revision and run `npm ci` if needed. Verify the current Sites project/access through the Sites connector; never create a replacement Site.
2. Run the Data builder with `--source` because the custom presentation shell removes the top bar at the user's explicit request. Do not use the prebuilt runtime, which would omit this shell change. This source build does not support `--separate-data`.
3. Preview the built page. Check English controls, no Ask ChatGPT bar, Co-authorship enabled on first load and reset, country filtering, pan/zoom and location details.
4. Package with the Data `package-data-app-for-sites.mjs` helper using `--source` and the same project ID. Generate a new temporary deployment token in memory; pass only its hash and expiry to packaging. Preserve the existing owner runtime secret.
5. Use the Sites source workflow with a fresh short-lived source credential to append the exact packaged source to the existing Sites source repository. The Sites source repository is separate from this GitHub repository. Never force-push or put credentials in files or Git remotes.
6. Save the exact pushed source commit with its matching deployment archive and deploy that saved version. Preserve public access. Source packaging and build output must match; do not edit between commit and deployment.
7. Upload the complete HTML/snapshot assets from the same authoring checkout using the Data upload helper, the in-memory deployment token, and the trusted Sites ingress credential. Verify readiness and hash readback.
8. Check the public page, then report the unchanged public URL.

Use the ordinary full-data source workflow. The separate-data publication-source helper is for prebuilt split bundles and cannot prepare this custom source package. Do not upload original Excel sources or private working directories. Keep generated `.data-app-*`, offline exports, `dist/`, credentials, and dependency folders out of GitHub.

There is deliberately no GitHub-to-Sites automatic deployment configured. Publishing is an explicit reviewed Codex action.
