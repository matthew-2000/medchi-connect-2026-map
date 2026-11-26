# Collaboration

1. Accept your repository invitation and clone the project.
2. Pull the latest `main`, then create a branch such as `feat/map-labels` or `fix/location-popup`.
3. Keep the user-facing interface in English. Preserve the map-first layout and default co-authorship links.
4. Run `npm ci` once after cloning or dependency changes; run `npm run build` after edits. Verify affected interactions in a browser, including reset, filters and any modified popup or zoom behavior.
5. Push the branch and open a pull request. Describe the user-visible behavior and verification. Review and merge before publishing the shared production map.

GitHub is the shared source of truth. Every push or merge to `main` automatically builds and deploys the map to GitHub Pages. Pull requests run the build without publishing. Review and merge changes to publish them. The earlier Sites link remains a separate snapshot and is not updated by this workflow. Repository collaborator access and Sites editor access are separate.

The root AGENTS.md governs the copied Data runtime. Routine map changes belong in `src/content/`, `src/theme.css` and `src/data.json`. Do not patch built output, disable the verifier, or modify the integrity manifest by hand. The current custom shell is an explicitly requested presentation change and therefore uses source builds.

Keep raw workbooks, contact details, tokens, deployment credentials and machine-specific files out of Git. Repository data is the reviewed public subset only. Inspect any future data changes before publishing.
