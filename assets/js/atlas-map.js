import geography from "../data/hainan-geography.js";
import initAtlasHotels from "./atlas-hotels.js";

/**
 * Local, dependency-free editorial map. Geometry is real Natural Earth land.
 * Bay points are approximate place labels, never hotel locations or boundaries.
 */
const SVG_NS = "http://www.w3.org/2000/svg";
const COS_LATITUDE = Math.cos((19.2 * Math.PI) / 180);
const project = ([longitude, latitude]) => [
    (longitude - 109.5) * 1000 * COS_LATITUDE,
    (19.2 - latitude) * 1000,
];
const pathFor = (coordinates) =>
    coordinates
        .map(
            (point, index) =>
                `${index ? "L" : "M"}${project(point)
                    .map((value) => value.toFixed(2))
                    .join(",")}`,
        )
        .join("") + "Z";
const PRIMARY = geography.features.find(
    (feature) => feature.properties.primary,
);
const MAIN_PATH = pathFor(PRIMARY.geometry.coordinates[0]);
const CONTEXT_PATH = geography.features
    .filter((feature) => !feature.properties.primary)
    .map((feature) => pathFor(feature.geometry.coordinates[0]))
    .join("");
// Approximate aerodrome reference point: CAAC AIP ZJSY AD 2.2,
// N18°18.1′ E109°24.8′ (https://yinlei.org/x-plane10/doc/ZJSY.pdf).
// Direction lines are editorial diagrams, never navigation or road geometry.
const AIRPORT = [109.4133, 18.3017];
const isTransferScene = (value) => value === "arrival" || value === "transfer";
const TRANSFERS = {
    "sanya-bay": {
        minutes: 15,
        kilometres: 10,
        hotel: "Pullman Oceanview Sanya Bay",
    },
    dadonghai: {
        minutes: 35,
        kilometres: 19,
        hotel: "JW Marriott Sanya Dadonghai Bay",
    },
    "yalong-bay": {
        minutes: 30,
        kilometres: 32,
        hotel: "Sanya Marriott Yalong Bay",
    },
    "haitang-bay": {
        minutes: 40,
        kilometres: 49,
        hotel: "JW Marriott Sanya Haitang Bay",
    },
};

const AREAS = [
    {
        id: "sanya-bay",
        name: "Саньявань",
        chinese: "三亚湾",
        coordinates: [109.41, 18.294],
        number: "01",
        note: "Длинная набережная и городской ритм",
        label: [-24, -48],
        mobile: [-6, -48],
        priorities: ["kitchen", "parents"],
    },
    {
        id: "dadonghai",
        name: "Дадунхай",
        chinese: "大东海",
        coordinates: [109.528, 18.222],
        number: "02",
        note: "Компактная бухта рядом с городом",
        label: [-25, 54],
        mobile: [-28, 52],
        priorities: ["baby", "kitchen"],
    },
    {
        id: "yalong-bay",
        name: "Ялунвань",
        chinese: "亚龙湾",
        coordinates: [109.645, 18.237],
        number: "03",
        note: "Пляжная жизнь и курортные отели",
        label: [8, 62],
        mobile: [36, 62],
        priorities: ["baby", "parents"],
    },
    {
        id: "haitang-bay",
        name: "Хайтанвань",
        chinese: "海棠湾",
        coordinates: [109.739, 18.352],
        number: "04",
        note: "Просторное побережье и большие резорты",
        label: [30, -54],
        mobile: [7, -50],
        priorities: [],
    },
];

const CITIES = [
    {
        name: "Хайкоу",
        sub: "海口",
        coordinates: [110.331, 20.032],
        offset: [14, -4],
    },
    {
        name: "Вэньчан",
        sub: "文昌",
        coordinates: [110.798, 19.548],
        offset: [14, 1],
    },
    {
        name: "Ваньнин",
        sub: "万宁",
        coordinates: [110.39, 18.796],
        offset: [13, 0],
    },
    {
        name: "Санья",
        sub: "三亚",
        coordinates: [109.508, 18.258],
        offset: [18, 6],
        featured: true,
    },
];

function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) =>
        element.setAttribute(key, value),
    );
    return element;
}

const clamp = (number, minimum, maximum) =>
    Math.max(minimum, Math.min(maximum, number));
const ease = (progress) => 1 - Math.pow(1 - progress, 4);

export default function initAtlasMap({ onSelect } = {}) {
    const mount = document.getElementById("atlas-map");
    if (!mount)
        return {
            setScene() {},
            setPriority() {},
            setTransfer() {},
            setHotels() {},
            selectArea() {},
            reset() {},
        };
    if (mount.atlasMap) return mount.atlasMap;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;
    let scene = "island";
    let selected = "";
    let hovered = "";
    let priority = "default";
    let transfer = "sanya-bay";
    let frame = 0;
    let destroyed = false;
    let camera;
    let tooltipArea = "";
    let tooltipTimer;
    const markerElements = new Map();
    const routeElements = new Map();
    const cityElements = [];

    mount.classList.add("atlas-map");
    mount.dataset.scene = scene;
    mount.dataset.priority = priority;
    mount.innerHTML = `
        <svg class="atlas-map-svg" xmlns="${SVG_NS}" role="img" aria-labelledby="atlas-map-title atlas-map-desc" preserveAspectRatio="none">
            <title id="atlas-map-title">Хайнань: от острова к четырём бухтам Саньи</title>
            <desc id="atlas-map-desc">Географическая карта острова. Прокрутите рассказ, чтобы приблизиться к Санье, затем выберите бухту кнопкой на карте. В главе прилёта показаны аэропорт Феникс SYX и условные направления к бухтам, не автомобильные маршруты. Береговая линия Natural Earth. Метки бухт приблизительные.</desc>
            <defs>
                <linearGradient id="atlas-land-color" x1="0" y1="0" x2="0.86" y2="1">
                    <stop offset="0" stop-color="#f7f0cc"/>
                    <stop offset="0.43" stop-color="#dce9bc"/>
                    <stop offset="1" stop-color="#b9d7b8"/>
                </linearGradient>
                <radialGradient id="atlas-land-light" cx="0.34" cy="0.31" r="0.78">
                    <stop offset="0" stop-color="#fffde3" stop-opacity=".48"/>
                    <stop offset=".67" stop-color="#c2dfb5" stop-opacity="0"/>
                    <stop offset="1" stop-color="#7dbdae" stop-opacity=".14"/>
                </radialGradient>
                <pattern id="atlas-land-dots" width="9" height="9" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r=".42" fill="#436b56" opacity=".11"/>
                    <circle cx="7" cy="6" r=".32" fill="#fffbed" opacity=".38"/>
                </pattern>
                <filter id="atlas-land-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="5" stdDeviation="12" flood-color="#538daa" flood-opacity=".17"/>
                </filter>
                <clipPath id="atlas-land-clip"><path d="${MAIN_PATH}"/></clipPath>
            </defs>
            <g class="atlas-map-world">
                <g class="atlas-map-grid" aria-hidden="true"></g>
                <g class="atlas-map-context"><path d="${CONTEXT_PATH}"/></g>
                <g class="atlas-map-coastal-echoes" aria-hidden="true">
                    <path d="${MAIN_PATH}" class="atlas-map-echo atlas-map-echo-5"/>
                    <path d="${MAIN_PATH}" class="atlas-map-echo atlas-map-echo-4"/>
                    <path d="${MAIN_PATH}" class="atlas-map-echo atlas-map-echo-3"/>
                    <path d="${MAIN_PATH}" class="atlas-map-echo atlas-map-echo-2"/>
                    <path d="${MAIN_PATH}" class="atlas-map-echo atlas-map-echo-1"/>
                </g>
                <path class="atlas-map-land" d="${MAIN_PATH}"/>
                <path class="atlas-map-land-light" d="${MAIN_PATH}"/>
                <path class="atlas-map-land-grain" d="${MAIN_PATH}"/>
                <g class="atlas-map-shore-highlights" aria-hidden="true"></g>
            </g>
            <g class="atlas-map-geographic-labels" aria-hidden="true"></g>
            <g class="atlas-map-city-labels" aria-hidden="true"></g>
            <g class="atlas-map-transfer-routes" aria-hidden="true"></g>
            <g class="atlas-map-coordinate-labels" aria-hidden="true"></g>
        </svg>
        <div class="atlas-map-airport" aria-hidden="true">
            <span class="atlas-map-airport-point"></span>
            <span class="atlas-map-airport-label">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5 14 8V3.5a2 2 0 0 0-4 0V8L3 11.5V14l7-2v6l-3 2v1.5l5-1 5 1V20l-3-2v-6l7 2Z"/></svg>
                <span><b>SYX</b><small>Аэропорт Феникс</small></span>
            </span>
        </div>
        <div class="atlas-map-transfer-note">До отелей-ориентиров · линии не повторяют дороги</div>
        <div class="atlas-map-place-labels" aria-label="Бухты Саньи"></div>
        <div class="atlas-map-hovercard" role="tooltip" id="atlas-map-tooltip" hidden>
            <span class="atlas-map-hovercard-kicker">Бухта <b></b></span>
            <strong></strong><p></p><span class="atlas-map-hovercard-action">Рассмотреть подробнее <span aria-hidden="true">↗</span></span>
        </div>
        <div class="atlas-map-compass" aria-hidden="true">
            <span>С</span><svg viewBox="0 0 24 46"><path d="M12 1L17 29L12 24L7 29Z"/><path class="atlas-map-compass-tail" d="M12 1V45"/></svg>
        </div>
        <div class="atlas-map-scale" aria-hidden="true"><span></span><i></i></div>
        <div class="atlas-map-attribution"><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a><span> · ориентиры бухт</span></div>
    `;
    const svg = mount.querySelector(".atlas-map-svg");
    const world = mount.querySelector(".atlas-map-world");
    const grid = mount.querySelector(".atlas-map-grid");
    const coordinateLabels = mount.querySelector(
        ".atlas-map-coordinate-labels",
    );
    const placeLabels = mount.querySelector(".atlas-map-place-labels");
    const cityLayer = mount.querySelector(".atlas-map-city-labels");
    const geographicLabels = mount.querySelector(
        ".atlas-map-geographic-labels",
    );
    const tooltip = mount.querySelector(".atlas-map-hovercard");
    const scaleLabel = mount.querySelector(".atlas-map-scale span");
    const scaleLine = mount.querySelector(".atlas-map-scale i");
    const coastHighlightLayer = mount.querySelector(
        ".atlas-map-shore-highlights",
    );
    const routeLayer = mount.querySelector(".atlas-map-transfer-routes");
    const airport = mount.querySelector(".atlas-map-airport");
    const hotelLayer = initAtlasHotels({
        mount,
        screenPoint,
        beforeOpen: hideTooltip,
    });

    const islandName = svgElement("g", { class: "atlas-map-island-name" });
    islandName.innerHTML =
        '<text class="atlas-map-island-chinese" text-anchor="middle" y="-22">海 南</text><text class="atlas-map-island-russian" text-anchor="middle" y="18">Х А Й Н А Н Ь</text><text class="atlas-map-island-latitude" text-anchor="middle" y="42">19° С. Ш.  /  109° В. Д.</text>';
    geographicLabels.appendChild(islandName);
    const seaName = svgElement("g", { class: "atlas-map-sea-name" });
    seaName.innerHTML =
        '<text text-anchor="middle" class="atlas-map-sea-russian">Ю Ж Н О - К И Т А Й С К О Е</text><text text-anchor="middle" y="19" class="atlas-map-sea-russian">М О Р Е</text>';
    geographicLabels.appendChild(seaName);

    for (const city of CITIES) {
        const group = svgElement("g", {
            class: `atlas-map-city${city.featured ? " atlas-map-city-featured" : ""}`,
        });
        group.innerHTML = `${city.featured ? '<circle class="atlas-map-city-aura" r="15"/><circle class="atlas-map-city-ring" r="9"/>' : ""}<circle class="atlas-map-city-point" r="${city.featured ? 4.5 : 2.5}"/><text x="${city.offset[0]}" y="${city.offset[1]}" class="atlas-map-city-name">${city.name}</text><text x="${city.offset[0]}" y="${city.offset[1] + 16}" class="atlas-map-city-chinese">${city.sub}</text>`;
        cityLayer.appendChild(group);
        cityElements.push({ element: group, city });
    }

    // Highlight existing coastline vertices rather than inventing resort borders.
    const coastline = PRIMARY.geometry.coordinates[0];
    const coastRanges = {
        "sanya-bay": [
            [109.33351, 18.30427],
            [109.48072, 18.2648],
        ],
        dadonghai: [
            [109.51075, 18.21361],
            [109.52955, 18.22769],
        ],
        "yalong-bay": [
            [109.62192, 18.22085],
            [109.67726, 18.24506],
        ],
        "haitang-bay": [
            [109.72657, 18.30378],
            [109.7461, 18.3959],
        ],
    };
    const nearestIndex = (point) =>
        coastline.reduce(
            (best, candidate, index) => {
                const distance =
                    (candidate[0] - point[0]) ** 2 +
                    (candidate[1] - point[1]) ** 2;
                return distance < best.distance ? { index, distance } : best;
            },
            { index: 0, distance: Infinity },
        ).index;

    AREAS.forEach((area) => {
        const route = svgElement("path", {
            class: "atlas-map-transfer-route",
            "data-transfer": area.id,
        });
        const routeAccent = svgElement("path", {
            class: "atlas-map-transfer-accent",
            "data-transfer": area.id,
            pathLength: "100",
        });
        routeLayer.append(route, routeAccent);
        routeElements.set(area.id, { route, routeAccent });
        const range = coastRanges[area.id]
            .map(nearestIndex)
            .sort((a, b) => a - b);
        const highlight = svgElement("path", {
            class: "atlas-map-shore-highlight",
            "data-area": area.id,
            d: pathFor(coastline.slice(range[0], range[1] + 1)).replace(
                /Z$/,
                "",
            ),
        });
        coastHighlightLayer.appendChild(highlight);
        // A generous invisible coast target complements the labelled buttons.
        const coastTarget = svgElement("path", {
            class: "atlas-map-coast-hit",
            "data-area": area.id,
            d: highlight.getAttribute("d"),
            "aria-hidden": "true",
        });
        coastTarget.addEventListener("pointerenter", (event) => {
            if (scene !== "island" && event.pointerType !== "touch")
                showTooltip(area.id);
        });
        coastTarget.addEventListener("pointerleave", hideTooltip);
        coastTarget.addEventListener("click", () => {
            if (scene === "island") return;
            selectArea(area.id);
            hideTooltip();
            if (typeof onSelect === "function") onSelect(area.id);
        });
        coastHighlightLayer.appendChild(coastTarget);
        const marker = document.createElement("div");
        marker.className = "atlas-map-marker";
        marker.dataset.area = area.id;
        marker.innerHTML = `<span class="atlas-map-marker-stem" aria-hidden="true"></span><button type="button" class="atlas-map-area" aria-label="${area.name}: ${area.note}. Открыть описание" aria-pressed="false" tabindex="-1"><span class="atlas-map-area-dot" aria-hidden="true"></span><span class="atlas-map-area-label"><span class="atlas-map-area-number">${area.number}</span><span class="atlas-map-area-name">${area.name}</span><span class="atlas-map-area-chinese">${area.chinese}</span></span></button>`;
        const button = marker.querySelector("button");
        marker.addEventListener("pointerenter", (event) => {
            if (event.pointerType !== "touch") showTooltip(area.id);
        });
        marker.addEventListener("pointerleave", hideTooltip);
        button.addEventListener("focus", () => showTooltip(area.id));
        button.addEventListener("blur", hideTooltip);
        button.addEventListener("click", () => {
            selectArea(area.id);
            hideTooltip();
            if (typeof onSelect === "function") onSelect(area.id);
        });
        button.addEventListener("keydown", (event) => {
            if (event.key === "Escape") hideTooltip();
            if (
                ![
                    "ArrowLeft",
                    "ArrowRight",
                    "ArrowUp",
                    "ArrowDown",
                    "Home",
                    "End",
                ].includes(event.key)
            )
                return;
            event.preventDefault();
            const current = AREAS.indexOf(area);
            const next =
                event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? AREAS.length - 1
                      : (current +
                            (["ArrowLeft", "ArrowUp"].includes(event.key)
                                ? -1
                                : 1) +
                            AREAS.length) %
                        AREAS.length;
            markerElements.get(AREAS[next].id).button.focus();
        });
        placeLabels.appendChild(marker);
        markerElements.set(area.id, { marker, button, highlight, area });
    });

    function targetCamera(nextScene) {
        const mobile = width < 760;
        if (nextScene === "island") {
            const center = project([109.7, 19.23]);
            const k = Math.min(
                (width * (mobile ? 0.62 : 0.46)) / 2360,
                (height * (mobile ? 0.46 : 0.66)) / 2120,
            );
            return {
                k,
                x: width * (mobile ? 0.5 : 0.68) - center[0] * k,
                y: height * (mobile ? 0.31 : 0.48) - center[1] * k,
            };
        }
        const south = nextScene === "south";
        const center = project(
            south
                ? [109.57, 18.4]
                : isTransferScene(nextScene)
                  ? [109.575, 18.3]
                  : [109.575, 18.31],
        );
        const k = Math.min(
            (width * (mobile ? 0.82 : 0.5)) / (south ? 1000 : 505),
            (height * (mobile ? 0.34 : 0.54)) / (south ? 620 : 310),
        );
        return {
            k,
            x: width * (mobile ? 0.52 : 0.7) - center[0] * k,
            y: height * (mobile ? 0.28 : 0.5) - center[1] * k,
        };
    }

    function screenPoint(coordinates) {
        const [x, y] = project(coordinates);
        return [camera.x + x * camera.k, camera.y + y * camera.k];
    }

    function drawGrid() {
        grid.replaceChildren();
        coordinateLabels.replaceChildren();
        const close = scene !== "island";
        const spacing = close ? 0.25 : 1;
        const longitudeStart = close ? 108.5 : 107;
        const longitudeEnd = close ? 111.0 : 113;
        const latitudeStart = close ? 17.5 : 17;
        const latitudeEnd = close ? 20.0 : 22;
        for (
            let longitude = longitudeStart;
            longitude <= longitudeEnd;
            longitude += spacing
        ) {
            const a = project([longitude, 16]);
            const b = project([longitude, 24]);
            grid.appendChild(
                svgElement("path", { d: `M${a.join(",")}L${b.join(",")}` }),
            );
        }
        for (
            let latitude = latitudeStart;
            latitude <= latitudeEnd;
            latitude += spacing
        ) {
            const a = project([105, latitude]);
            const b = project([115, latitude]);
            grid.appendChild(
                svgElement("path", { d: `M${a.join(",")}L${b.join(",")}` }),
            );
        }
    }

    function updateCoordinateLabels() {
        coordinateLabels.replaceChildren();
        if (width < 760) return;
        const step = scene === "island" ? 1 : 0.25;
        const start = scene === "island" ? 108 : 109;
        const end = scene === "island" ? 112 : 110.25;
        for (let longitude = start; longitude <= end; longitude += step) {
            const [x] = screenPoint([longitude, 18]);
            if (x < width * 0.4 || x > width - 95) continue;
            const text = svgElement("text", {
                x,
                y: height - 87,
                "text-anchor": "middle",
            });
            text.textContent = `${longitude.toFixed(step === 1 ? 0 : 2)}° В`;
            coordinateLabels.appendChild(text);
        }
    }

    function draw() {
        if (!camera || destroyed) return;
        world.setAttribute(
            "transform",
            `translate(${camera.x.toFixed(2)} ${camera.y.toFixed(2)}) scale(${camera.k.toFixed(5)})`,
        );
        cityElements.forEach(({ element, city }) => {
            const point = screenPoint(city.coordinates);
            element.setAttribute(
                "transform",
                `translate(${point[0].toFixed(1)} ${point[1].toFixed(1)})`,
            );
        });
        const islandPoint = screenPoint([109.56, 19.22]);
        islandName.setAttribute(
            "transform",
            `translate(${islandPoint[0].toFixed(1)} ${islandPoint[1].toFixed(1)})`,
        );
        const seaPoint =
            scene === "island"
                ? screenPoint([110.65, 17.98])
                : [
                      width * (width < 760 ? 0.53 : 0.76),
                      height * (width < 760 ? 0.58 : 0.78),
                  ];
        seaName.setAttribute(
            "transform",
            `translate(${seaPoint[0].toFixed(1)} ${seaPoint[1].toFixed(1)}) rotate(-7)`,
        );
        const airportPoint = screenPoint(AIRPORT);
        airport.style.transform = `translate(${airportPoint[0].toFixed(1)}px,${airportPoint[1].toFixed(1)}px)`;
        markerElements.forEach(({ marker, area }) => {
            const [x, y] = screenPoint(area.coordinates);
            const offsets =
                isTransferScene(scene) && area.id === "sanya-bay"
                    ? width < 760
                        ? [-12, 56]
                        : [-32, 61]
                    : width < 760
                      ? area.mobile
                      : area.label;
            marker.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
            marker.style.setProperty("--label-x", `${offsets[0]}px`);
            marker.style.setProperty("--label-y", `${offsets[1]}px`);
            marker.style.setProperty(
                "--stem-height",
                `${Math.abs(offsets[1]) - 10}px`,
            );
            marker.style.setProperty(
                "--stem-rotation",
                `${(Math.atan2(offsets[0], -offsets[1]) * 180) / Math.PI}deg`,
            );
            // Draw in screen coordinates so each curve has the same stroke weight
            // while the geographic camera moves. The curves carry no road data.
            const dx = x - airportPoint[0];
            const arc =
                area.id === "sanya-bay"
                    ? 28
                    : Math.min(102, Math.max(35, dx * 0.23));
            const controlX =
                area.id === "sanya-bay"
                    ? airportPoint[0] - 38
                    : airportPoint[0] + dx * 0.48;
            const controlY = Math.min(y, airportPoint[1]) - arc;
            const routePath = `M${airportPoint.join(",")}Q${controlX.toFixed(1)},${controlY.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
            const routeParts = routeElements.get(area.id);
            routeParts.route.setAttribute("d", routePath);
            routeParts.routeAccent.setAttribute("d", routePath);
        });
        // Projection has 1000 units per latitude degree; 1 degree ≈ 111.2 km.
        const scaleKm = scene === "island" ? 50 : scene === "south" ? 20 : 10;
        scaleLabel.textContent = `${scaleKm} км`;
        scaleLine.style.width = `${(scaleKm / 111.2) * 1000 * camera.k}px`;
        if (tooltipArea) positionTooltip(tooltipArea);
        hotelLayer.draw();
        updateCoordinateLabels();
    }

    function animateCamera(target, immediate = false) {
        cancelAnimationFrame(frame);
        if (immediate || reduceMotion.matches || !camera) {
            camera = target;
            draw();
            return;
        }
        const initial = { ...camera };
        const start = performance.now();
        const duration = 1550;
        function step(now) {
            const progress = clamp((now - start) / duration, 0, 1);
            const t = ease(progress);
            camera = {
                x: initial.x + (target.x - initial.x) * t,
                y: initial.y + (target.y - initial.y) * t,
                k: initial.k + (target.k - initial.k) * t,
            };
            draw();
            if (progress < 1) frame = requestAnimationFrame(step);
        }
        frame = requestAnimationFrame(step);
    }

    function updateStates() {
        markerElements.forEach(({ marker, button, highlight, area }) => {
            const active =
                area.id === (isTransferScene(scene) ? transfer : selected);
            const over = area.id === hovered;
            const relevant = area.priorities.includes(priority);
            marker.classList.toggle("is-selected", active);
            marker.classList.toggle("is-hovered", over);
            marker.classList.toggle("is-relevant", relevant);
            highlight.classList.toggle("is-selected", active);
            highlight.classList.toggle("is-hovered", over);
            highlight.classList.toggle("is-relevant", relevant);
            button.setAttribute("aria-pressed", String(active));
            const transferInfo = TRANSFERS[area.id];
            const transferScene = isTransferScene(scene);
            const secondaryLabel = button.querySelector(
                ".atlas-map-area-chinese",
            );
            secondaryLabel.textContent = transferScene
                ? `≈${transferInfo.minutes} мин · ${transferInfo.kilometres} км`
                : area.chinese;
            secondaryLabel.classList.toggle("is-transfer-stat", transferScene);
            button.setAttribute(
                "aria-label",
                transferScene
                    ? `${area.name}: около ${transferInfo.minutes} минут, ${transferInfo.kilometres} км от SYX до ${transferInfo.hotel}. Показать поездку`
                    : `${area.name}: ${area.note}. Открыть описание`,
            );
            button.tabIndex = scene === "island" ? -1 : 0;
            const routeParts = routeElements.get(area.id);
            routeParts.route.classList.toggle(
                "is-active",
                area.id === transfer,
            );
            routeParts.routeAccent.classList.toggle(
                "is-active",
                area.id === transfer,
            );
        });
        mount.classList.toggle("has-map-selection", Boolean(selected));
        mount.classList.toggle(
            "has-map-priority",
            priority !== "default" && !isTransferScene(scene),
        );
        placeLabels.setAttribute("aria-hidden", String(scene === "island"));
    }

    function positionTooltip(id) {
        const area = AREAS.find((item) => item.id === id);
        if (!area) return;
        const [x, y] = screenPoint(area.coordinates);
        const tooltipWidth = tooltip.offsetWidth || 260;
        const tooltipHeight = tooltip.offsetHeight || 150;
        const leftLimit = width < 760 ? 16 : width * 0.405;
        let left = clamp(x + 26, leftLimit, width - tooltipWidth - 24);
        let top = y + 26;
        if (top + tooltipHeight > height - 100) top = y - tooltipHeight - 40;
        if (area.id === "haitang-bay") top = y + 26;
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${clamp(top, 100, height - tooltipHeight - 80)}px`;
    }

    function showTooltip(id) {
        if (scene === "island") return;
        clearTimeout(tooltipTimer);
        const area = AREAS.find((item) => item.id === id);
        if (!area) return;
        hovered = id;
        tooltipArea = id;
        tooltip.querySelector("b").textContent = area.number;
        tooltip.querySelector("strong").textContent = area.name;
        const transferInfo = TRANSFERS[id];
        tooltip.querySelector("p").textContent = isTransferScene(scene)
            ? `От SYX до ${transferInfo.hotel}: около ${transferInfo.minutes} минут. Расстояние по данным отеля — ${transferInfo.kilometres} км. Время зависит от трафика.`
            : area.note;
        tooltip.querySelector(".atlas-map-hovercard-action").innerHTML =
            `${isTransferScene(scene) ? "Сравнить поездку" : "Рассмотреть подробнее"} <span aria-hidden="true">↗</span>`;
        tooltip.hidden = false;
        markerElements
            .get(id)
            .button.setAttribute("aria-describedby", "atlas-map-tooltip");
        positionTooltip(id);
        updateStates();
        requestAnimationFrame(() => tooltip.classList.add("is-visible"));
    }

    function hideTooltip() {
        hovered = "";
        tooltipArea = "";
        markerElements.forEach(({ button }) =>
            button.removeAttribute("aria-describedby"),
        );
        tooltip.classList.remove("is-visible");
        tooltipTimer = setTimeout(
            () => {
                tooltip.hidden = true;
            },
            reduceMotion.matches ? 0 : 180,
        );
        updateStates();
    }

    function setScene(nextScene) {
        if (
            ![
                "island",
                "south",
                "arrival",
                "transfer",
                "bays",
                "daily",
                "homes",
            ].includes(nextScene)
        )
            nextScene = "island";
        if (nextScene === scene) return;
        scene = nextScene;
        mount.dataset.scene = scene;
        hotelLayer.setScene(scene);
        hideTooltip();
        drawGrid();
        updateStates();
        animateCamera(targetCamera(scene));
    }

    function setPriority(nextPriority = "default") {
        const aliases = {
            child: "baby",
            comfort: "parents",
            windsurfing: "windsurf",
            all: "default",
            family: "default",
        };
        priority = aliases[nextPriority] || nextPriority;
        mount.dataset.priority = priority;
        updateStates();
    }

    function selectArea(id) {
        if (id && !AREAS.some((area) => area.id === id)) return;
        selected = id || "";
        mount.dataset.selected = selected;
        if (id && isTransferScene(scene)) {
            transfer = id;
            mount.dataset.transfer = transfer;
        }
        updateStates();
    }

    function setTransfer(id = "sanya-bay") {
        if (!AREAS.some((area) => area.id === id)) return;
        transfer = id;
        mount.dataset.transfer = transfer;
        updateStates();
    }

    function setHotels(visible = false) {
        hotelLayer.setEnabled(visible);
    }

    function resize() {
        width = mount.clientWidth || window.innerWidth;
        height = mount.clientHeight || window.innerHeight;
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        animateCamera(targetCamera(scene), true);
    }

    const resizeObserver =
        typeof ResizeObserver === "function"
            ? new ResizeObserver(resize)
            : null;
    if (resizeObserver) resizeObserver.observe(mount);
    else window.addEventListener("resize", resize);
    drawGrid();
    resize();
    updateStates();
    mount.classList.add("is-ready");

    const api = {
        setScene,
        setPriority,
        setTransfer,
        setHotels,
        selectArea,
        reset() {
            selectArea("");
            setPriority("default");
            setTransfer("sanya-bay");
            setHotels(false);
            setScene("island");
        },
        destroy() {
            destroyed = true;
            cancelAnimationFrame(frame);
            clearTimeout(tooltipTimer);
            hotelLayer.destroy();
            if (resizeObserver) resizeObserver.disconnect();
            else window.removeEventListener("resize", resize);
            delete mount.atlasMap;
            mount.replaceChildren();
        },
    };
    mount.atlasMap = api;
    return api;
}
