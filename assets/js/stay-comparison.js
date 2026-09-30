import { parseStayFacts, STAY_FIELDS } from "./stay-facts.js";

const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};
const button = (className, text) => {
    const node = element("button", className, text);
    node.type = "button";
    return node;
};
const link = (href, text, className) => {
    const node = element("a", className, text);
    node.href = href;
    return node;
};

export default function initStayComparison({ section, onRemove }) {
    const tray = section?.querySelector("[data-comparison-tray]");
    const panel = section?.querySelector("[data-comparison-panel]");
    if (!tray || !panel) return { update() {} };

    const openButton = tray.querySelector("[data-comparison-open]");
    const chipList = tray.querySelector("[data-comparison-chips]");
    const tableWrap = panel.querySelector("[data-comparison-table]");
    const status = panel.querySelector("[data-comparison-status]");
    const heading = panel.querySelector("h3");
    const cache = new Map();
    const items = new Map();
    let selected = [];
    let opened = false;

    section.querySelectorAll(".stay-row[data-stay]").forEach((row) => {
        const title = row.querySelector(".stay-name h3 a");
        if (!title) return;
        let url;
        try {
            const parsed = new URL(title.getAttribute("href"), location.href);
            if (parsed.origin !== location.origin) return;
            parsed.hash = "";
            url = parsed.href;
        } catch { return; }
        items.set(row.dataset.stay, {
            slug: row.dataset.stay,
            row,
            title,
            url,
            name: title.textContent.trim(),
            bays: [...row.querySelectorAll(".stay-bay-tag")].map((node) => node.textContent.trim()),
            types: [...row.querySelectorAll(".stay-tags .eyebrow")].map((node) => node.textContent.trim()),
        });
    });

    const factsFor = (item) => cache.get(item.url)?.result || { status: "loading" };
    const retryButton = (item) => {
        const retry = button("stay-facts-retry", "Повторить загрузку");
        retry.dataset.retryStay = item.slug;
        retry.setAttribute("aria-label", `Повторить загрузку условий: ${item.name}`);
        return retry;
    };

    function hydrate(item, result) {
        item.row.dataset.stayFactsState = result.status;
        const feature = item.row.querySelector("[data-stay-feature]");
        if (result.status === "ready") {
            const name = result.fields.name;
            if (!name.missing && name.value !== "Не уточнено") {
                item.name = name.value;
                item.title.textContent = name.value;
                const save = item.row.querySelector("[data-save]");
                if (save) save.setAttribute("aria-label", `${save.getAttribute("aria-pressed") === "true" ? "Убрать из сравнения" : "Добавить к сравнению"}: ${name.value}`);
                item.row.querySelector(".stay-open")?.setAttribute("aria-label", `Подробнее: ${name.value}`);
            }
        }
        if (!feature) return;
        const label = element("span", "stay-facts-summary");
        if (result.status === "ready") {
            label.textContent = `Кухня: ${result.fields.kitchen.value}`;
        } else if (result.status === "loading") {
            label.textContent = "Загружаю условия…";
        } else if (result.status === "missing") {
            label.textContent = "Условия ещё не заполнены";
        } else if (result.status === "malformed") {
            label.textContent = "Нужно проверить таблицу условий";
        } else {
            label.textContent = "Условия не удалось загрузить";
        }
        const detail = element("small");
        if (result.status === "error") detail.append(retryButton(item));
        else detail.append(link(item.url, "Подробнее в заметке ↗"));
        feature.replaceChildren(label, detail);
    }

    async function load(item, force = false) {
        if (!force && cache.has(item.url)) return cache.get(item.url).promise;
        const entry = { result: { status: "loading" }, promise: null };
        cache.set(item.url, entry);
        hydrate(item, entry.result);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        entry.promise = (async () => {
            try {
                const response = await fetch(item.url, { credentials: "omit", signal: controller.signal });
                if (!response.ok || new URL(response.url).origin !== location.origin) throw new Error("Post unavailable");
                const html = await response.text();
                if (html.length > 3000000) throw new Error("Post too large");
                entry.result = parseStayFacts(html, item.url);
            } catch {
                entry.result = { status: "error", message: "Не удалось загрузить условия из заметки. Попробуйте ещё раз." };
            } finally {
                clearTimeout(timeout);
            }
            hydrate(item, entry.result);
            renderTray();
            if (opened && selected.includes(item.slug)) renderTable();
            return entry.result;
        })();
        return entry.promise;
    }

    function remove(slug) {
        const index = selected.indexOf(slug);
        onRemove(slug);
        // The caller persists selection and synchronously invokes update().
        requestAnimationFrame(() => {
            const nextSlug = selected[Math.min(index, selected.length - 1)];
            const region = opened ? tableWrap : chipList;
            const target = [...region.querySelectorAll("[data-comparison-remove]")].find((node) => node.dataset.comparisonRemove === nextSlug);
            const row = items.get(slug)?.row;
            const fallback = opened ? heading : !openButton.disabled && !tray.hidden ? openButton
                : row && !row.hidden ? row.querySelector("[data-save]") : section.querySelector("[data-stay-saved]");
            (target || fallback)?.focus({ preventScroll: true });
        });
    }

    function renderTray() {
        const focusedSlug = chipList.contains(document.activeElement) ? document.activeElement.dataset.comparisonRemove : null;
        tray.hidden = !selected.length;
        tray.querySelector("[data-comparison-count]").textContent = `${selected.length} / 4`;
        tray.querySelector("[data-comparison-hint]").textContent = selected.length < 2
            ? "Добавьте ещё один вариант"
            : selected.length > 4 ? "Оставьте до четырёх вариантов для сравнения"
                : "Выбор сохранён в этом браузере";
        openButton.disabled = selected.length < 2 || selected.length > 4;
        openButton.setAttribute("aria-expanded", String(opened));
        chipList.replaceChildren(...selected.map((slug) => {
            const item = items.get(slug);
            const chip = element("span", "stay-comparison-chip");
            const name = element("span", "", item.name);
            name.title = item.name;
            const removeButton = button("", "×");
            removeButton.dataset.comparisonRemove = slug;
            removeButton.setAttribute("aria-label", `Убрать из сравнения: ${item.name}`);
            chip.append(name, removeButton);
            return chip;
        }));
        if (focusedSlug) [...chipList.querySelectorAll("[data-comparison-remove]")].find((node) => node.dataset.comparisonRemove === focusedSlug)?.focus({ preventScroll: true });
    }

    function factCell(fact, key, slug) {
        const cell = element("td");
        cell.append(element("p", `stay-comparison-value${fact.value === "Не уточнено" ? " is-unknown" : ""}`, fact.value));
        if (fact.note || fact.sources?.length) {
            const details = element("details", "stay-comparison-detail");
            details.dataset.comparisonDetail = `${key}:${slug}`;
            details.append(element("summary", "", "Примечание и источники"));
            if (fact.note) details.append(element("p", "", fact.note));
            if (fact.sources?.length) {
                const sources = element("ul");
                fact.sources.forEach((source) => {
                    const sourceItem = element("li");
                    sourceItem.append(link(source.href, `${source.label} ↗`));
                    sources.append(sourceItem);
                });
                details.append(sources);
            }
            cell.append(details);
        }
        return cell;
    }

    function renderTable() {
        const openedDetails = new Set([...tableWrap.querySelectorAll("details[open]")].map((node) => node.dataset.comparisonDetail));
        const active = tableWrap.contains(document.activeElement) ? {
            remove: document.activeElement.dataset.comparisonRemove,
            retry: document.activeElement.dataset.retryStay,
            detail: document.activeElement.closest("details")?.dataset.comparisonDetail,
        } : null;
        const chosen = selected.map((slug) => items.get(slug));
        if (chosen.length < 2 || chosen.length > 4) {
            tableWrap.replaceChildren();
            status.textContent = chosen.length > 4 ? "Для сравнения оставьте от двух до четырёх вариантов. Уберите лишние с помощью капсул выше."
                : "Для сравнения нужны хотя бы два варианта. Добавьте ещё один из списка выше.";
            panel.setAttribute("aria-busy", "false");
            return;
        }
        const loading = chosen.some((item) => factsFor(item).status === "loading");
        const unavailable = chosen.filter((item) => !["ready", "loading"].includes(factsFor(item).status)).length;
        panel.setAttribute("aria-busy", String(loading));
        status.textContent = loading ? "Загружаю условия из выбранных заметок…" : unavailable
            ? `У ${unavailable} из ${chosen.length} вариантов условия пока недоступны. Причина указана под названием.`
            : `Сравниваю ${chosen.length} варианта. Раскройте примечания, чтобы проверить условия и источники.`;

        const table = element("table", "stay-comparison-table");
        table.dataset.columns = String(chosen.length);
        const caption = element("caption", "visually-hidden", "Сравнение выбранных вариантов жилья");
        const head = element("thead");
        const headRow = element("tr");
        const labelHead = element("th", "stay-comparison-property", "Что сравниваю");
        labelHead.scope = "col";
        headRow.append(labelHead);
        chosen.forEach((item) => {
            const cell = element("th");
            cell.scope = "col";
            const name = link(item.url, item.name, "stay-comparison-name");
            const removeButton = button("stay-comparison-remove", "Убрать ×");
            removeButton.dataset.comparisonRemove = item.slug;
            removeButton.setAttribute("aria-label", `Убрать из сравнения: ${item.name}`);
            cell.append(name, removeButton);
            const result = factsFor(item);
            if (result.status === "loading") cell.append(element("p", "stay-comparison-column-status", "Загрузка…"));
            else if (result.status !== "ready") {
                cell.append(element("p", "stay-comparison-column-status", result.message));
                if (result.status === "error") cell.append(retryButton(item));
                else cell.append(link(item.url, "Открыть заметку ↗", "stay-comparison-post"));
            } else if (result.warnings.length) {
                cell.append(element("p", "stay-comparison-column-status", "Часть полей ещё не заполнена."));
            }
            headRow.append(cell);
        });
        head.append(headRow);
        const body = element("tbody");
        const rows = [["bay", "Бухта"], ["type", "Тип жилья"], ...STAY_FIELDS.filter(([key]) => key !== "name")];
        rows.forEach(([key, label]) => {
            const row = element("tr");
            row.dataset.compareField = key;
            const property = element("th", "stay-comparison-property", label);
            property.scope = "row";
            row.append(property);
            chosen.forEach((item) => {
                const result = factsFor(item);
                let fact;
                if (key === "bay" || key === "type") {
                    const values = key === "bay" ? item.bays : item.types;
                    fact = { value: values.join(" · ") || "Не уточнено" };
                } else if (result.status === "ready") fact = result.fields[key];
                else fact = { value: result.status === "loading" ? "…" : "Нет данных" };
                row.append(factCell(fact, key, item.slug));
            });
            body.append(row);
        });
        table.append(caption, head, body);
        tableWrap.replaceChildren(table);
        tableWrap.querySelectorAll("details").forEach((node) => { node.open = openedDetails.has(node.dataset.comparisonDetail); });
        if (active) {
            const focusTarget = [...tableWrap.querySelectorAll("[data-comparison-remove], [data-retry-stay], details")].find((node) =>
                (active.remove && node.dataset.comparisonRemove === active.remove)
                || (active.retry && node.dataset.retryStay === active.retry)
                || (active.detail && node.dataset.comparisonDetail === active.detail));
            (focusTarget?.tagName === "DETAILS" ? focusTarget.querySelector("summary") : focusTarget)?.focus({ preventScroll: true });
        }
    }

    openButton.addEventListener("click", () => {
        if (selected.length < 2 || selected.length > 4) return;
        opened = true;
        panel.hidden = false;
        selected.forEach((slug) => load(items.get(slug)));
        renderTray();
        renderTable();
        heading.focus({ preventScroll: true });
        panel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    });
    panel.querySelector("[data-comparison-close]").addEventListener("click", () => {
        opened = false;
        panel.hidden = true;
        renderTray();
        const returnFocus = !tray.hidden && !openButton.disabled ? openButton : section.querySelector("[data-stay-saved]");
        returnFocus?.focus({ preventScroll: false });
    });
    section.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-comparison-remove]");
        if (removeButton) remove(removeButton.dataset.comparisonRemove);
        const retry = event.target.closest("[data-retry-stay]");
        if (retry) {
            const item = items.get(retry.dataset.retryStay);
            if (item) {
                load(item, true);
                if (opened) renderTable();
            }
        }
    });

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
            if (!entry.isIntersecting || entry.target.hidden) return;
            const item = items.get(entry.target.dataset.stay);
            if (item) load(item);
            observer.unobserve(entry.target);
        }));
        items.forEach((item) => observer.observe(item.row));
    } else {
        const hydrateVisible = () => items.forEach((item) => {
            if (cache.has(item.url) || item.row.hidden) return;
            const bounds = item.row.getBoundingClientRect();
            if (bounds.bottom > 0 && bounds.top < innerHeight) load(item);
        });
        addEventListener("scroll", hydrateVisible, { passive: true });
        hydrateVisible();
    }

    return {
        update(slugs) {
            const next = [...new Set(slugs)].filter((slug) => items.has(slug));
            const changed = next.join("|") !== selected.join("|");
            selected = next;
            renderTray();
            if (opened && changed) {
                selected.forEach((slug) => load(items.get(slug)));
                renderTable();
            }
        },
    };
}
