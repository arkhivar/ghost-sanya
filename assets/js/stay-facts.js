// The keys form the editor contract; Russian labels can be changed in a post.
export const STAY_FIELDS = Object.freeze([
    ["name", "Название"],
    ["airport-time", "Время в дороге"],
    ["airport-distance", "От аэропорта SYX"],
    ["kitchen", "Кухня"],
    ["price", "Стоимость"],
    ["room", "Номер / апартаменты"],
    ["occupancy", "Размещение семьи"],
    ["price-basis", "Условия цены"],
    ["beach", "Путь к пляжу"],
    ["children", "С детьми"],
    ["pool", "Бассейн"],
    ["windsurf", "Виндсёрфинг"],
    ["stars", "Звёзды"],
    ["address", "Адрес"],
    ["checked", "Проверка данных"],
]);

export function cleanFactText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function safeSourceUrl(value, baseUrl) {
    const href = cleanFactText(value);
    if (!href) return null;
    try {
        const url = new URL(href, baseUrl);
        return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
            ? url.href
            : null;
    } catch {
        return null;
    }
}

// Pure validation is shared by the browser parser and the contract tests.
export function normalizeFactRows(rows, baseUrl) {
    const knownKeys = new Set(STAY_FIELDS.map(([key]) => key));
    const fields = {};
    const warnings = [];
    for (const row of rows) {
        const key = cleanFactText(row.key);
        if (!knownKeys.has(key)) {
            warnings.push(`Неизвестное поле: ${key || "без ключа"}.`);
            continue;
        }
        if (Object.hasOwn(fields, key)) {
            return { status: "malformed", message: `В таблице повторяется поле «${key}».` };
        }
        if (!row.validCells) {
            return { status: "malformed", message: `У поля «${key}» должны быть название, значение и примечание.` };
        }
        const sources = [];
        for (const source of row.sources || []) {
            const href = safeSourceUrl(source.href, baseUrl);
            if (href && !sources.some((item) => item.href === href)) {
                sources.push({ href, label: cleanFactText(source.label) || new URL(href).hostname });
            }
        }
        fields[key] = {
            value: cleanFactText(row.value) || "Не уточнено",
            note: cleanFactText(row.note),
            sources,
            missing: false,
        };
    }
    if (!Object.keys(fields).length) {
        return { status: "malformed", message: "В таблице нет распознаваемых полей условий проживания." };
    }
    for (const [key, label] of STAY_FIELDS) {
        if (!Object.hasOwn(fields, key)) {
            warnings.push(`Отсутствует поле «${label}».`);
            fields[key] = {
                value: "Не уточнено",
                note: "Это поле пока не заполнено в таблице условий проживания.",
                sources: [],
                missing: true,
            };
        }
    }
    return { status: "ready", fields, warnings };
}

function visibleText(element) {
    const copy = element.cloneNode(true);
    copy.querySelectorAll("script, style, template, noscript").forEach((node) => node.remove());
    return copy.textContent;
}

export function parseStayFacts(html, baseUrl) {
    const document = new DOMParser().parseFromString(html, "text/html");
    const blocks = document.querySelectorAll("[data-stay-facts]");
    if (!blocks.length) {
        return { status: "missing", message: "В этой заметке ещё нет таблицы условий проживания." };
    }
    if (blocks.length !== 1) {
        return { status: "malformed", message: "В заметке должно быть ровно одно описание условий проживания." };
    }
    const block = blocks[0];
    if (block.tagName !== "SECTION" || block.dataset.stayFacts !== "1") {
        return { status: "malformed", message: "Формат таблицы условий проживания пока не поддерживается." };
    }
    if (block.querySelectorAll("table").length !== 1) {
        return { status: "malformed", message: "В блоке условий проживания нужна одна таблица." };
    }
    const rows = [...block.querySelectorAll("tbody > tr")].map((row) => {
        const cells = [...row.children];
        const valueCell = cells[1];
        const noteCell = cells[2];
        return {
            key: row.dataset.field,
            validCells: cells.length === 3 && cells[0]?.tagName === "TH" && valueCell?.tagName === "TD" && noteCell?.tagName === "TD"
                && !cells.some((cell) => cell.hasAttribute("rowspan") || cell.hasAttribute("colspan")),
            value: valueCell ? visibleText(valueCell) : "",
            note: noteCell ? visibleText(noteCell) : "",
            sources: cells.slice(1).flatMap((cell) => [...cell.querySelectorAll("a[href]")].map((link) => ({
                href: link.getAttribute("href"),
                label: visibleText(link),
            }))),
        };
    });
    return normalizeFactRows(rows, baseUrl);
}
