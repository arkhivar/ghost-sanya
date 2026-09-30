# Hainan map data

The map uses **Natural Earth 1:10m land v5.1.1**, in the public domain.

- Dataset: https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/
- License: https://www.naturalearthdata.com/about/terms-of-use/
- Download: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson
- Retrieved: 2026-09-30.

`hainan-land.geojson` is the local WGS84 subset. `hainan-geography.js` contains
the same geometry as an ES module so the public site needs no remote requests.
The Hainan exterior contains 671 vertices. The 54 regional polygons are clipped
to `[107.0, 16.8, 113.2, 22.4]` and rounded to five decimal places. No smoothing
changes the outline. Polygon holes are omitted; these are coastal land shapes,
not inland-water data.

The site projects coordinates equirectangularly with longitude correction at
19.2° north. Scale bars are approximate at that latitude. North is up.

Bay markers indicate approximate bay locations. Highlighted coastline segments
use vertices from the same source. They do **not** represent administrative
boundaries, walkable routes, property boundaries, or confirmed hotel positions.
City labels are approximate geographic context. The soft concentric coastal
bands are decorative shore echoes, **not measured bathymetry or depth contours**.
Natural Earth is suitable for regional editorial maps; it is generalized and
should not be used for street navigation or to measure hotel-to-beach distance.

To regenerate, download the source to this folder as
`ne_10m_land.source.geojson`, then run `node assets/data/prepare-geography.mjs`.
Do not include the 10 MB global source file in the release package.

Priority emphasis is an editorial comparison aid. No windsurfing location is
highlighted because rental availability has not been verified.
