# MedCHI Connect 2026 — public geographic dataset

This sharing package contains only the fields needed for the author-affiliation map. Scope: 32 contributions reconciled with the public conference programme, 89 named authors, 26 institutions and 7 countries. It is not a complete register of attendees, speakers or every programme item.

## Open in QGIS

Extract the entire archive, then open `institutions.shp`. Keep `.shp`, `.shx`, `.dbf`, `.prj` and `.cpg` together. CRS: EPSG:4326 / WGS 84; X is longitude and Y is latitude, in decimal degrees. Text encoding: UTF-8. All points have city-level precision; they are not building, home or attendance locations.

## Files and joins

- `institutions`: 26 representative institutional city points. CSV and GeoJSON include public geographic references.
- `author_contributions`: 102 author–contribution relations at their institutional city points. Full titles are retained in CSV and GeoJSON. Shapefile titles are joined through `paper_ref` to `contributions.csv` to avoid DBF text truncation.
- `contributions.csv`: public contribution titles and associated named authors. `paper_ref` is generated for this public package; it is not a submission-system identifier.
- `collaborations`: pairs of institutions sharing a mapped contribution. `from_id` and `to_id` join to `inst_id`. Lines are geographic connections, not travel routes. Same-coordinate pairs remain in the CSV without zero-length lines in the geographic layers.

`n_authors` counts distinct named authors; `n_papers` counts distinct mapped contributions. Institution counts are not necessarily additive. `review=1` in DBF / `needs_review=true` in CSV and GeoJSON indicates that the individual branch is unconfirmed for INAIL or the University of Campania. Other city points still do not confirm an individual building or campus.

DBF abbreviations: `inst_name` = institution; `iso2` = country_code; `review` = needs_review. `paper_refs` contains public-package references separated by semicolons in DBF and a JSON array in CSV/GeoJSON.

The map clusters nearby locations for readability and separates them on zoom. The GIS points retain their original city coordinates.

## Data included in sharing

Names, public contribution titles, institutional affiliations, city coordinates and derived counts are included. No source workbooks, email addresses, source-sheet rows, acceptance decisions, corresponding-author flags or original submission identifiers are included. The internal working dataset is not part of this package.

## Public references and attribution

Checked on 26 November 2026.

- Conference programme: https://sites.google.com/unisa.it/medchi2026-connect/program/program
- Institutional city coordinates: Research Organization Registry, https://ror.org (CC0 metadata), using GeoNames data, https://www.geonames.org (CC BY 3.0).
- Belfast and Turin branches were resolved using institutional staff/location pages. Actual coordinate references are preserved in `coord_source`; a record used as a source for a city coordinate does not imply affiliation with that record’s institution.
- Leganés city point: https://www.openstreetmap.org/relation/342087 — © OpenStreetMap contributors, ODbL, https://www.openstreetmap.org/copyright , geocoded through https://photon.komoot.io/ .
- Map background in the HTML only: Natural Earth 1:50m, public domain, https://www.naturalearthdata.com/ .

## Validation

SHP/DBF files were reopened and compared with public source rows. Counts, joins, coordinates, field lengths and UTF-8 text were checked. The source workbooks are not distributed. Original source-file references and internal flags were removed from the sharing artifact, rather than merely hidden in the interface.
