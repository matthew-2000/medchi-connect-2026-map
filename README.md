# MedCHI Connect 2026 — Author affiliations map

A map-first, English presentation of author affiliations and co-authorship for MedCHI Connect 2026. Co-authorship is enabled on first load and after **Reset map**. The application top bar is intentionally hidden for this presentation.

- Public map (automatic deployment): https://matthew-2000.github.io/medchi-connect-2026-map/
- Earlier Sites publication: https://medchi-connect-2026-map.m-ercolino.chatgpt.site
- Collaboration: https://github.com/matthew-2000/medchi-connect-2026-map
- Official programme: https://sites.google.com/unisa.it/medchi2026-connect/program/program

## Run locally

Use Node.js 22.12 or later (Node 24 LTS recommended) and npm.

```sh
git clone https://github.com/matthew-2000/medchi-connect-2026-map.git
cd medchi-connect-2026-map
npm ci
npm run dev -- --host 127.0.0.1
```

Open the localhost address printed by Vite. No API keys or Excel workbooks are required. To verify and build the complete standalone page:

```sh
npm run verify:runtime
npm run build
npx vite preview --host 127.0.0.1
```

The build produces `dist/index.html`. GitHub Actions builds this static page and deploys it to Pages after every push to `main`. Pull requests are built without being published. See [DEPLOYMENT.md](DEPLOYMENT.md) for the workflow and the earlier Sites publication.

## Work together in Codex

Accept the GitHub invitation, clone this repository, and open its folder in Codex. Read `AGENTS.md` and `CONTRIBUTING.md`. Start one branch per change, open a pull request, and merge after review. GitHub Actions verifies the protected runtime and production build for pushes and pull requests.

Suggested starting prompt:

> Read README.md, AGENTS.md, CONTRIBUTING.md, and DEPLOYMENT.md. Work on the MedCHI map in English. Preserve the map-first presentation, Co-authorship enabled by default, the existing Sites identity, and the cleaned public dataset. Implement my requested change on a new branch, build it, and verify the affected map interactions.

## Files to edit

| File | Purpose |
| --- | --- |
| `src/content/dashboard/DashboardContent.jsx` | Map, controls, clustering, co-authorship links and location details |
| `src/content/dashboard/atlas.css` | Map presentation and responsive styles |
| `src/content/assets/world.json` | Embedded Natural Earth basemap |
| `src/data.json` | Cleaned reviewed public affiliation/contribution records |
| `src/theme.css` | Shared theme tokens |
| `geodata/` | GIS deliverables, including shapefiles and GeoJSON |

The shared Data runtime is included so a fresh checkout can run independently. Its protected files have an integrity manifest; follow `AGENTS.md` for any explicitly requested infrastructure change.

## Dataset and geographic limits

The current snapshot contains 102 author–contribution records, 89 unique authors, 32 contributions, 26 institutions and 7 countries. The map displays institutional affiliation locations at city level, not authors' home addresses or real-time whereabouts. Coordinates, geographic review flags, and location provenance are retained in the reviewed snapshot. Clusters group nearby map points visually; they do not imply a shared institution. Lines connect institutions with a shared contribution, rather than every possible person-to-person relationship.

The source Excel workbooks, email addresses, acceptance flags and internal submission IDs are excluded. The repository contains only the cleaned map dataset and necessary application source. Do not add the original workbooks or credentials.

Names and contribution titles were checked against the public programme. Geographic positioning remains an approximation; review the recorded source and review flag when correcting locations. The baseline snapshot is fixed; publication does not automatically import later conference updates.

Natural Earth geographic data is public domain. Other source materials and bundled dependencies retain their respective rights and licences; no blanket licence is asserted for third-party material.
