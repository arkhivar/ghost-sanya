import locations from "../data/hotel-locations.js";

const HOTEL_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V5h14v16M3 21h18M9 21v-5h6v5M9 9h1m4 0h1M9 12h1m4 0h1M8 5V3h8v2"/></svg>';
const ELIGIBLE_SCENES = new Set(["bays", "daily", "homes"]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Public post previews, joined to independently verified map coordinates. */
export default function initAtlasHotels({ mount, screenPoint, beforeOpen }) {
    const source = document.querySelector("[data-atlas-hotels]");
    const posts = source
        ? [...source.querySelectorAll("[data-hotel-slug]")]
        : [];
    const entries = posts.flatMap((post) => {
        const slug = post.dataset.hotelSlug;
        const location = locations[slug];
        if (!location?.coordinates || location.coordinates.length !== 2)
            return [];
        const sourceLink = post.querySelector(".hotel-source-link");
        if (!sourceLink) return [];
        const image = post.querySelector(".hotel-source-image");
        return [
            {
                slug,
                ...location,
                title:
                    post
                        .querySelector(".hotel-source-title")
                        ?.textContent.trim() || sourceLink.textContent.trim(),
                excerpt:
                    post
                        .querySelector(".hotel-source-excerpt")
                        ?.textContent.trim() || "",
                url: sourceLink.href,
                image: image ? { src: image.src, alt: image.alt } : null,
            },
        ];
    });
    let enabled = false;
    let scene = "island";
    let active = null;
    let pinned = false;
    let closeTimer;
    let previewTimer;
    let suppressFocus = false;
    let destroyed = false;

    const layer = document.createElement("div");
    layer.className = "atlas-hotel-layer";
    layer.setAttribute("aria-label", "Жильё из моего списка");
    layer.hidden = true;
    const card = document.createElement("aside");
    card.className = "atlas-hotel-card";
    card.id = "atlas-hotel-preview";
    card.setAttribute("aria-label", "Карточка жилья");
    card.hidden = true;
    card.innerHTML = `<div class="atlas-hotel-card-visual"><img alt="" hidden><div class="atlas-hotel-card-placeholder" aria-hidden="true">${HOTEL_ICON}<span>Место для нашей истории</span></div><span class="atlas-hotel-card-image-note"></span></div><div class="atlas-hotel-card-copy"><span class="atlas-hotel-card-bay"></span><h3></h3><p></p><a class="atlas-hotel-card-link">Открыть заметку <span aria-hidden="true">↗</span></a><a class="atlas-hotel-card-location-note" target="_blank" rel="noopener"></a></div><button type="button" class="atlas-hotel-card-close" aria-label="Закрыть карточку жилья">×</button>`;
    mount.append(layer, card);
    const hotelAttribution = document.createElement("span");
    hotelAttribution.className = "atlas-hotel-attribution";
    hotelAttribution.innerHTML =
        ' · объекты: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a> и карты отелей';
    mount.querySelector(".atlas-map-attribution")?.append(hotelAttribution);
    const cardLink = card.querySelector(".atlas-hotel-card-link");
    const cardImage = card.querySelector("img");
    const cardPlaceholder = card.querySelector(".atlas-hotel-card-placeholder");
    const imageNote = card.querySelector(".atlas-hotel-card-image-note");
    const markers = new Map();
    const isVisible = () => enabled && ELIGIBLE_SCENES.has(scene);

    for (const entry of entries) {
        const anchor = document.createElement("div");
        anchor.className = "atlas-hotel-anchor";
        anchor.innerHTML =
            '<svg class="atlas-hotel-label-leader" aria-hidden="true"><path/></svg><span class="atlas-hotel-anchor-point" aria-hidden="true"></span>';
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = "atlas-hotel-pin";
        marker.dataset.hotel = entry.slug;
        marker.setAttribute(
            "aria-label",
            `${entry.title}. Открыть карточку жилья`,
        );
        marker.setAttribute("aria-expanded", "false");
        marker.setAttribute("aria-controls", card.id);
        marker.innerHTML = '<span class="atlas-hotel-pin-name"></span>';
        marker.querySelector(".atlas-hotel-pin-name").textContent =
            entry.shortName || entry.title;
        marker.addEventListener("pointerenter", (event) => {
            if (event.pointerType === "touch" || pinned) return;
            clearClose();
            clearTimeout(previewTimer);
            if (active && active.slug !== entry.slug) {
                previewTimer = setTimeout(() => show(entry), 220);
            } else show(entry);
        });
        marker.addEventListener("pointerleave", () => {
            clearTimeout(previewTimer);
            deferClose();
        });
        marker.addEventListener("focus", () => {
            if (!suppressFocus) show(entry);
        });
        marker.addEventListener("blur", (event) => {
            if (!card.contains(event.relatedTarget)) deferClose();
        });
        marker.addEventListener("click", (event) => {
            show(entry, true);
            if (event.detail === 0) cardLink.focus();
        });
        marker.addEventListener("keydown", (event) => {
            if (
                event.key === "Tab" &&
                !event.shiftKey &&
                active?.slug === entry.slug
            ) {
                event.preventDefault();
                pinned = true;
                cardLink.focus();
            }
        });
        anchor.append(marker);
        layer.append(anchor);
        markers.set(entry.slug, marker);
    }

    function clearClose() {
        clearTimeout(closeTimer);
    }

    function deferClose() {
        clearClose();
        clearTimeout(previewTimer);
        if (pinned) return;
        closeTimer = setTimeout(() => {
            if (
                card.matches(":hover") ||
                card.contains(document.activeElement) ||
                markers.get(active?.slug) === document.activeElement
            )
                return;
            close();
        }, 600);
    }

    function show(entry, pin = false) {
        if (!isVisible() || destroyed) return;
        clearClose();
        clearTimeout(previewTimer);
        if (beforeOpen) beforeOpen();
        active = entry;
        pinned = pin;
        card.hidden = false;
        card.dataset.hotel = entry.slug;
        card.querySelector("h3").textContent = entry.title;
        card.querySelector("p").textContent = entry.excerpt;
        card.querySelector(".atlas-hotel-card-bay").textContent =
            entry.areaName || "Мой список жилья";
        const locationNote = card.querySelector(
            ".atlas-hotel-card-location-note",
        );
        locationNote.textContent =
            entry.note || "Метка указывает расположение объекта";
        locationNote.href = entry.source;
        cardLink.href = entry.url;
        cardLink.setAttribute("aria-label", `Читать заметку: ${entry.title}`);
        cardImage.hidden = !entry.image;
        cardPlaceholder.hidden = Boolean(entry.image);
        imageNote.textContent = entry.image
            ? "Из карточки места"
            : "Фотография пока не добавлена";
        if (entry.image) {
            cardImage.src = entry.image.src;
            cardImage.alt = entry.image.alt;
        } else {
            cardImage.removeAttribute("src");
            cardImage.alt = "";
        }
        markers.forEach((marker, slug) => {
            marker.classList.toggle("is-active", slug === entry.slug);
            marker.setAttribute("aria-expanded", String(slug === entry.slug));
        });
        draw();
    }

    function close({ restoreFocus = false } = {}) {
        clearClose();
        clearTimeout(previewTimer);
        const previous = active;
        active = null;
        pinned = false;
        card.hidden = true;
        card.removeAttribute("data-hotel");
        markers.forEach((marker) => {
            marker.classList.remove("is-active");
            marker.setAttribute("aria-expanded", "false");
        });
        if (restoreFocus && previous && isVisible()) {
            suppressFocus = true;
            markers.get(previous.slug)?.focus();
            queueMicrotask(() => {
                suppressFocus = false;
            });
        }
    }

    function draw() {
        if (!isVisible() || destroyed) return;
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        // Clickable names sit inland; decorative leaders end at geographic dots.
        const labelBand = clamp(height * 0.32, 232, 340);
        entries.forEach((entry) => {
            const [x, y] = screenPoint(entry.coordinates);
            const marker = markers.get(entry.slug);
            marker.parentElement.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            const [offsetX, offsetY] = entry.offset || [0, 0];
            const label = marker.querySelector(".atlas-hotel-pin-name");
            const labelX = clamp(
                x + offsetX + (entry.labelOffsetX || 0),
                width * 0.48 + label.offsetWidth / 2,
                width - label.offsetWidth / 2 - 36,
            );
            const labelY = labelBand + (entry.labelRow || 0) * 56;
            const dx = labelX - x;
            const dy = labelY - y;
            marker.style.left = `${dx}px`;
            marker.style.top = `${dy}px`;
            marker.parentElement.querySelector(".atlas-hotel-label-leader path").setAttribute(
                "d", `M0 -4 L${offsetX} ${offsetY - 24} L${dx.toFixed(1)} ${offsetY - 100} L${dx.toFixed(1)} ${(dy + 4).toFixed(1)}`,
            );
        });
        if (!active) return;
        const point = screenPoint(active.coordinates);
        const [x, y] = point;
        const cardWidth = card.offsetWidth || 308;
        const cardHeight = card.offsetHeight || 370;
        const activeLabel = markers.get(active.slug);
        const labelLeft = x + parseFloat(activeLabel.style.left) - activeLabel.offsetWidth / 2;
        const labelRight = labelLeft + activeLabel.offsetWidth;
        const leftLimit = width * 0.435;
        const rightLimit = width - cardWidth - 18;
        const afterMarker = Math.max(x + 12, labelRight + 12);
        const desiredLeft =
            afterMarker <= rightLimit
                ? afterMarker
                : Math.min(x - 12, labelLeft - 12) - cardWidth;
        card.style.left = `${clamp(desiredLeft, leftLimit, rightLimit)}px`;
        card.style.top = `${clamp(y - 65, 114, Math.max(114, height - cardHeight - 135))}px`;
    }

    function updateVisibility() {
        const visible = isVisible();
        layer.hidden = !visible;
        mount.classList.toggle("has-hotel-layer", visible);
        mount.dataset.hotels = String(enabled);
        if (!visible) close();
        else draw();
    }

    card.addEventListener("pointerenter", () => {
        clearClose();
        clearTimeout(previewTimer);
    });
    card.addEventListener("pointerleave", deferClose);
    card.addEventListener("focusin", clearClose);
    card.addEventListener("focusout", (event) => {
        if (
            !card.contains(event.relatedTarget) &&
            !layer.contains(event.relatedTarget)
        ) {
            pinned = false;
            deferClose();
        }
    });
    card.querySelector(".atlas-hotel-card-close").addEventListener(
        "click",
        () => close({ restoreFocus: true }),
    );
    const onKeydown = (event) => {
        if (event.key === "Escape" && active) {
            event.preventDefault();
            event.stopPropagation();
            close({ restoreFocus: true });
        }
    };
    mount.addEventListener("keydown", onKeydown);
    cardImage.addEventListener("load", draw);
    cardImage.addEventListener("error", () => {
        cardImage.hidden = true;
        cardPlaceholder.hidden = false;
        imageNote.textContent = "Фотография недоступна";
    });

    return {
        setEnabled(value) {
            enabled = Boolean(value);
            updateVisibility();
        },
        setScene(value) {
            if (value !== scene) close();
            scene = value;
            updateVisibility();
        },
        draw,
        close,
        destroy() {
            destroyed = true;
            clearClose();
            clearTimeout(previewTimer);
            mount.removeEventListener("keydown", onKeydown);
            layer.remove();
            card.remove();
            hotelAttribution.remove();
        },
    };
}
