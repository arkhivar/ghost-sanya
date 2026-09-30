/** Approximate WGS84 property positions [longitude, latitude], checked 2026-09-30.
 * These are place markers, not verified entrances or routing data.
 * Oakwood/Horizon use OpenStreetMap. Argyle/Coconut use approximate GCJ-02
 * inverse conversion; Coconut's source datum is inferred from a same-platform
 * Horizon control point. Full evidence: content/hotel-map-sources.json.
 * A post without a matched property remains in the accommodation list only.
 */
export default {
    "oakwood-sanya": {
        coordinates: [109.4817681, 18.2768934],
        shortName: "Oakwood",
        areaName: "Саньявань · апартаменты",
        source: "https://www.openstreetmap.org/node/12098306501",
        sourceType: "Объект OpenStreetMap, сверенный с названием и адресом оператора",
        coordinateMethod: "WGS84 from OpenStreetMap node 12098306501",
        address: "118 Huixin Road, Sanya",
        labelOffsetX: -90,
        labelRow: 0,
        note: "Приблизительное расположение · OpenStreetMap",
    },
    "coconut-sea-time": {
        coordinates: [109.512516, 18.224196],
        rawCoordinates: [109.516597, 18.222499],
        shortName: "Coconut Sea Time",
        areaName: "Дадунхай · апартаменты",
        source: "https://www.trip.com/hotels/sanya-hotel-detail-1252444/sanya-coconut-sea-time-sea-view-holiday-apartment/",
        sourceType: "Карта объекта Trip.com, ID 1252444",
        coordinateMethod: "Approximate GCJ-02 to WGS84 inverse; source CRS inferred from a same-platform Horizon control point",
        address: "Jinling Seaview Garden, 19 Haiyun Road, Sanya",
        labelOffsetX: -16,
        labelRow: 1,
        offset: [-12, -19],
        note: "Приблизительное расположение · карта объекта Trip.com",
    },
    "horizon-yalong-bay": {
        coordinates: [109.63799, 18.23158],
        shortName: "Horizon",
        areaName: "Ялунвань · курортный отель",
        source: "https://www.openstreetmap.org/way/1336745225",
        sourceType: "Центр территории объекта в OpenStreetMap",
        coordinateMethod: "WGS84 reference point for OpenStreetMap way 1336745225",
        address: "Yalong Bay National Resort District, Sanya",
        labelOffsetX: 10,
        labelRow: 1,
        offset: [32, -38],
        note: "Центр территории по OpenStreetMap · не точка входа",
    },
    "argyle-yalong-bay": {
        coordinates: [109.621613, 18.237754],
        rawCoordinates: [109.625575, 18.235916],
        shortName: "Argyle",
        areaName: "Ялунвань · курортный отель",
        source: "https://www.amap.com/place/B0FFI6O2UN",
        sourceType: "Объект Amap, сверенный с названием и адресом Trip.com",
        coordinateMethod: "Approximate GCJ-02 to WGS84 inverse of Amap POI B0FFI6O2UN",
        address: "9 Longxi Road, Sanya",
        labelOffsetX: 0,
        labelRow: 0,
        offset: [-37, -23],
        note: "Приблизительное расположение · карта объекта Amap",
    },
};
