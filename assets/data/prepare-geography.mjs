/**
 * Rebuild with: node assets/data/prepare-geography.mjs
 * Input: ne_10m_land.source.geojson from the Natural Earth vector repository.
 * The source is public-domain Natural Earth 1:10m land, v5.1.1.
 * Keep only polygons intersecting Hainan's regional context, then clip those
 * polygons to a local extent. Geographic coordinates remain WGS84.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(fs.readFileSync(path.join(directory, 'ne_10m_land.source.geojson'), 'utf8'));
const extent = [107.0, 16.8, 113.2, 22.4];
const inside = (point, ring) => {
    let result = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > point[1]) !== (yj > point[1]) && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi) result = !result;
    }
    return result;
};
function clip(ring) {
    let points = ring.slice(0, -1);
    for (const [axis, value, greater] of [[0, extent[0], true], [0, extent[2], false], [1, extent[1], true], [1, extent[3], false]]) {
        const output = [];
        for (let i = 0; i < points.length; i++) {
            const a = points[(i + points.length - 1) % points.length], b = points[i];
            const inA = greater ? a[axis] >= value : a[axis] <= value;
            const inB = greater ? b[axis] >= value : b[axis] <= value;
            if (inA !== inB) {
                const t = (value - a[axis]) / (b[axis] - a[axis]);
                output.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
            }
            if (inB) output.push(b);
        }
        points = output;
        if (!points.length) break;
    }
    if (points.length) points.push(points[0]);
    return points.map(point => point.map(value => Number(value.toFixed(5))));
}
const features = [];
for (const feature of source.features) {
    const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
    for (const polygon of polygons) {
        const exterior = clip(polygon[0]);
        if (exterior.length < 4) continue;
        const hainan = inside([109.5, 19.3], polygon[0]);
        features.push({type: 'Feature', properties: {name: hainan ? 'Hainan' : 'Regional land', primary: hainan}, geometry: {type: 'Polygon', coordinates: [exterior]}});
    }
}
const data = {type: 'FeatureCollection', source: 'Natural Earth 1:10m land v5.1.1, public domain', features};
fs.writeFileSync(path.join(directory, 'hainan-land.geojson'), JSON.stringify(data));
fs.writeFileSync(path.join(directory, 'hainan-geography.js'), `// Natural Earth 1:10m land, public domain. See GEOGRAPHY.md.\nexport default ${JSON.stringify(data)};\n`);
process.stdout.write(JSON.stringify({polygons: features.length, hainanVertices: features.filter(f => f.properties.primary).map(f => f.geometry.coordinates[0].length), bytes: JSON.stringify(data).length}) + '\n');
