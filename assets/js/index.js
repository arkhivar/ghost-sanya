import "../css/index.css";
import initAtlasMap from "./atlas-map.js";
import initDesktopGate from "./desktop-gate.js";
import initJanuary from "./january.js";

const areas = {
    "sanya-bay": {
        name: "Саньявань",
        number: "01",
        tagline: "ГОРОД И ДЛИННОЕ ПОБЕРЕЖЬЕ",
        description:
            "Начну с повседневной жизни: апартаменты, городские дела и длинное побережье. Здесь особенно важно выбрать конкретный участок.",
        detail: "Проверять адрес, а не только название бухты: магазины, пляж и возможный спот могут оказаться далеко друг от друга.",
        card: "Длинное побережье, городская жизнь и варианты апартаментов. Здесь решает конкретный адрес.",
        consider: "Смотреть: пеший путь до моря и магазинов.",
    },
    dadonghai: {
        name: "Дадунхай",
        number: "02",
        tagline: "МОРЕ В ГОРОДСКОМ РИТМЕ",
        description:
            "Я рассматриваю Дадунхай как возможность совместить пляж и обычную жизнь. Сначала проверю дом, окружение и путь к воде.",
        detail: "Близость кафе и магазинов полезна, но я отдельно посмотрю шум, переходы и удобство прогулок с коляской.",
        card: "Пляж, кафе и повседневные дела в одной части города. Присматриваюсь к жизни без лишних поездок.",
        consider: "Смотреть: шум и состояние конкретного дома.",
    },
    "yalong-bay": {
        name: "Ялунвань",
        number: "03",
        tagline: "ПЛЯЖ И КУРОРТНЫЙ КОМФОРТ",
        description:
            "Здесь я представляю дни вокруг моря и территории отеля. Чтобы эта картинка стала нашим месяцем, нужно решить вопрос кухни и бюджета.",
        detail: "Близость к морю проверю для конкретного корпуса. Удобный курортный быт зависит от номера и того, что включено.",
        card: "Бухта, которую рассматриваю ради моря и отдыха на территории отеля. Быт здесь стоит продумать отдельно.",
        consider: "Смотреть: кухня и стоимость всей конфигурации.",
    },
    "haitang-bay": {
        name: "Хайтанвань",
        number: "04",
        tagline: "ПРОСТОР И БОЛЬШИЕ КУРОРТЫ",
        description:
            "Добавляю эту бухту для сравнения: крупные курорты предлагают целый мир внутри отеля. Но близость моря ещё не означает удобное купание.",
        detail: "Хочу понять, насколько мы будем зависеть от транспорта и подойдут ли нам условия купания. Режим пляжа нужно уточнять на месте.",
        card: "Крупные курорты и отдельный мир внутри отеля. Важная точка сравнения для понимания всего побережья.",
        consider: "Смотреть: условия купания, расстояния и транспорт.",
    },
};
const priorities = {
    default: {
        label: "МОЙ ОРИЕНТИР",
        explanation:
            "Четыре отправные точки. У каждой — свои сильные стороны и вопросы к конкретному жилью.",
    },
    baby: {
        label: "ЕСЛИ ГЛАВНОЕ — МАЛЫШ",
        explanation:
            "Смотрю на повседневные маршруты, тишину для сна и детскую инфраструктуру. Всё это проверяется у конкретного дома.",
        areas: {
            "sanya-bay": [
                "Для малыша мне важен небольшой удобный мир вокруг дома: магазин, прогулка и возможность быстро вернуться на сон.",
                "Проверить переход к морю, тень, лифт и ближайший магазин.",
            ],
            dadonghai: [
                "Рассматриваю сочетание пляжа и городских удобств. Если нужное окажется в пешей доступности, день будет проще.",
                "Проверить шум под окнами и реальный маршрут с коляской.",
            ],
            "yalong-bay": [
                "Семейный отель может собрать пляж, питание и занятия на одной территории. Смотрю, подходит ли инфраструктура годовалым.",
                "Уточнить кроватку, условия питания и расстояния внутри отеля.",
            ],
            "haitang-bay": [
                "Большая территория может быть удобной, если всё нужное рядом с номером. Но размеры курорта сами по себе ничего не гарантируют.",
                "Уточнить маршруты по отелю и альтернативы морскому купанию.",
            ],
        },
    },
    kitchen: {
        label: "ЕСЛИ ГЛАВНОЕ — КУХНЯ",
        explanation:
            "Кухня — свойство конкретных апартаментов, а не бухты. Для начала смотрю предложения Oakwood и Coconut Sea Time.",
        areas: {
            "sanya-bay": [
                "Здесь в нашем списке Oakwood: оператор указывает оборудованную кухню. Это хорошая отправная точка для длинного проживания.",
                "Подтвердить оснащение выбранного номера и итоговую цену.",
            ],
            dadonghai: [
                "В списке есть Coconut Sea Time с заявленной кухней. Важны состояние и комплектация именно той квартиры, которую предложат.",
                "Запросить фото плиты, посуды и холодильника.",
            ],
            "yalong-bay": [
                "Отельный отдых с готовкой возможен только при подходящем номере. «Мини-кухня» в описании ещё не отвечает на мой вопрос.",
                "Выяснить, разрешена ли готовка и есть ли плита.",
            ],
            "haitang-bay": [
                "Пока в нашем списке нет проверенного варианта с кухней в этой бухте. Сначала нужен конкретный объект.",
                "Не считать чайник и мини-бар полноценной кухней.",
            ],
        },
    },
    parents: {
        label: "ЕСЛИ ГЛАВНОЕ — КОМФОРТ",
        explanation:
            "Комфорт родителей — это сервис, удобный номер и посильные расстояния. Звёзды отеля не заменяют этих деталей.",
        areas: {
            "sanya-bay": [
                "Смотрю на сервисный формат апартаментов: своя кухня вместе с ресепшеном и уборкой. Родителям можно подобрать отдельное размещение рядом.",
                "Уточнить лифт, санузел, уборку и расположение номеров.",
            ],
            dadonghai: [
                "Городская жизнь может быть удобной, если дом спокойный и ухоженный. У частных апартаментов отдельно проверю предсказуемость сервиса.",
                "Уточнить уборку, ресепшен и тишину по вечерам.",
            ],
            "yalong-bay": [
                "Здесь присматриваюсь к курортному сервису и отдыху у моря. Важно, чтобы комфорт не терялся в длинных переходах по территории.",
                "Запросить соседние номера и удобный выход к пляжу.",
            ],
            "haitang-bay": [
                "Большие курорты интересны своим сервисом. Но я сначала оценю, удобно ли родителям перемещаться внутри и за пределами отеля.",
                "Уточнить расстояния, питание и транспорт.",
            ],
        },
    },
    windsurf: {
        label: "ПРОКАТ ПОКА НЕ ПОДТВЕРЖДЁН",
        explanation:
            "Ни одна бухта пока не получает отметку «виндсёрфинг решён». Наличие моря или водного центра не подтверждает аренду доски с парусом.",
        areas: {
            "sanya-bay": [
                "В исследовании есть след к базе в районе Хайпо. Спортивная база — ещё не доказательство, что туристу дадут комплект в аренду.",
                "Уточнить доступ для туристов, оборудование и зимний график.",
            ],
            dadonghai: [
                "Пока у нас нет подтверждённого самостоятельного проката рядом с жильём. Не буду подменять виндсёрфинг обычным сёрфингом или SUP.",
                "Нужен конкретный оператор и письменный ответ.",
            ],
            "yalong-bay": [
                "В карточке Horizon упоминается windsurfing. Хочу выяснить, означает ли это реальный прокат комплекта для опытного райдера.",
                "Уточнить доски, размеры парусов, аренду и условия выхода.",
            ],
            "haitang-bay": [
                "Открытое море и ветер не делают место готовым спотом. Подтверждённой аренды для нашей поездки здесь пока нет.",
                "Сначала проверить оператора, ограничения и условия на воде.",
            ],
        },
    },
};
const storage = {
    get(key, fallback) {
        try {
            return (
                JSON.parse(localStorage.getItem("hainan-atlas:" + key)) ??
                fallback
            );
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem("hainan-atlas:" + key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
};

function initStory() {
    if (!document.querySelector(".atlas-journey")) return;
    let activePriority = storage.get("priority", "default");
    if (!priorities[activePriority]) activePriority = "default";
    let activeArea = storage.get("area", "sanya-bay");
    if (!areas[activeArea]) activeArea = "sanya-bay";
    let currentScene = "";
    let currentStep = "";
    let exploring = false;
    let exploreTrigger = null;
    let hotelsEnabled = storage.get("hotel-layer", false) === true;
    const map = initAtlasMap({ onSelect: selectArea });
    const header = document.getElementById("site-header");
    const journey = document.querySelector(".atlas-journey");
    const scenes = [...document.querySelectorAll(".story-scene[data-scene]")];
    const dock = document.getElementById("priority-dock");
    const layerControls = document.querySelector(".atlas-layer-controls");
    const hotelToggle = document.querySelector("[data-hotels-toggle]");
    document.body.append(dock);
    const text = (id, value) => {
        const node = document.getElementById(id);
        if (node) node.textContent = value;
    };
    function setHotelLayer(enabled) {
        hotelsEnabled = enabled;
        map.setHotels(enabled);
        hotelToggle.setAttribute("aria-pressed", String(enabled));
        hotelToggle.setAttribute("aria-label", `${enabled ? "Скрыть" : "Показать"} гостиницы на карте`);
        storage.set("hotel-layer", enabled);
    }
    hotelToggle.addEventListener("click", () => setHotelLayer(!hotelsEnabled));
    setHotelLayer(hotelsEnabled);

    function updateBay() {
        const area = areas[activeArea],
            priority = priorities[activePriority],
            copy = priority.areas?.[activeArea];
        text("bay-name", area.name);
        text("bay-number", area.number);
        text("bay-tagline", area.tagline);
        text("bay-description", copy?.[0] || area.description);
        text("bay-detail", copy?.[1] || area.detail);
        text("bay-detail-label", priority.label);
        document.getElementById("bay-link").href = "/" + activeArea + "/";
        document
            .querySelectorAll(".area-tabs button[data-area]")
            .forEach((button) =>
                button.setAttribute(
                    "aria-pressed",
                    String(button.dataset.area === activeArea),
                ),
            );
    }
    function selectArea(id) {
        if (!areas[id]) return;
        if (
            !exploring &&
            (currentScene === "arrival" || currentScene === "transfer")
        ) {
            selectTransfer(id);
            return;
        }
        activeArea = id;
        storage.set("area", id);
        map.selectArea(id);
        updateBay();
        if (exploring) {
            const panel = document.querySelector(".explore-detail");
            if (panel) {
                panel.querySelector("strong").textContent = areas[id].name;
                panel.querySelector("p").textContent =
                    priorities[activePriority].areas?.[id]?.[0] ||
                    areas[id].description;
                panel.querySelector("a").href = "/" + id + "/";
            }
        }
    }
    function selectPriority(id) {
        if (!priorities[id]) return;
        activePriority = id;
        storage.set("priority", id);
        map.setPriority(id);
        document
            .querySelectorAll(".priority-options button[data-priority]")
            .forEach((button) =>
                button.setAttribute(
                    "aria-pressed",
                    String(button.dataset.priority === id),
                ),
            );
        text("priority-explainer", priorities[id].explanation);
        updateBay();
        document.querySelectorAll("[data-bay-row]").forEach((row) => {
            const area = areas[row.dataset.bayRow],
                copy = priorities[id].areas?.[row.dataset.bayRow];
            row.querySelector("[data-bay-copy]").textContent =
                copy?.[0] || area.card;
            row.querySelector("[data-bay-consider]").textContent =
                copy?.[1] || area.consider;
        });
        if (exploring) selectArea(activeArea);
    }
    document
        .querySelectorAll(".area-tabs button[data-area]")
        .forEach((button) =>
            button.addEventListener("click", () =>
                selectArea(button.dataset.area),
            ),
        );
    document
        .querySelectorAll(".priority-options button[data-priority]")
        .forEach((button) =>
            button.addEventListener("click", () =>
                selectPriority(button.dataset.priority),
            ),
        );
    function selectTransfer(id) {
        if (!areas[id]) return;
        map.setTransfer(id);
        document
            .querySelectorAll("[data-transfer-select]")
            .forEach((button) => {
                button.setAttribute(
                    "aria-pressed",
                    String(button.dataset.transferSelect === id),
                );
            });
    }
    document.querySelectorAll("[data-transfer-select]").forEach((button) => {
        button.addEventListener("click", () =>
            selectTransfer(button.dataset.transferSelect),
        );
    });
    document
        .querySelector("[data-wind-priority]")
        ?.addEventListener("click", () => selectPriority("windsurf"));
    selectArea(activeArea);
    selectPriority(activePriority);

    function syncScroll() {
        if (exploring) return;
        const viewport = window.innerHeight;
        let index = 0;
        scenes.forEach((scene, i) => {
            if (scene.getBoundingClientRect().top < viewport * 0.53) index = i;
        });
        const step = scenes[index];
        const next = step.dataset.scene;
        if (step.id !== currentStep) {
            currentStep = step.id;
            currentScene = next;
            map.setScene(next);
            if (next === "arrival" || next === "transfer")
                selectTransfer(step.dataset.transfer || "sanya-bay");
            else map.selectArea(activeArea);
            const chapter = step.dataset.chapter || next;
            document.querySelectorAll(".chapter-progress a").forEach((a) => {
                const active = a.dataset.chapter === chapter;
                a.classList.toggle("is-active", active);
                if (active) a.setAttribute("aria-current", "step");
                else a.removeAttribute("aria-current");
            });
            text(
                "map-kicker-text",
                next === "island"
                    ? "20° С. Ш. / 110° В. Д."
                    : next === "south"
                      ? "К ЮЖНОМУ ПОБЕРЕЖЬЮ"
                      : next === "arrival" || next === "transfer"
                        ? "SYX → НАША БУХТА"
                        : "ЧЕТЫРЕ БУХТЫ САНЬИ",
            );
        }
        const bottom = journey.getBoundingClientRect().bottom;
        dock.hidden =
            !["bays", "daily"].includes(next) ||
            bottom < window.innerHeight * 0.35;
        layerControls.hidden = !["bays", "daily"].includes(next) || bottom < window.innerHeight * 0.35;
        header.classList.toggle("is-paper", bottom <= header.offsetHeight + 1);
    }
    let scrollQueued = false;
    window.addEventListener(
        "scroll",
        () => {
            if (scrollQueued) return;
            scrollQueued = true;
            requestAnimationFrame(() => {
                syncScroll();
                scrollQueued = false;
            });
        },
        { passive: true },
    );
    window.addEventListener("resize", syncScroll, { passive: true });
    window.addEventListener("pageshow", syncScroll);
    syncScroll();

    const close = document.querySelector(".explore-close");
    const stage = document.querySelector(".atlas-stage");
    const background = [
        ...document.querySelectorAll(
            ".story-scene, main > :not(.atlas-journey), .site-header, .site-footer, .skip-link",
        ),
    ];
    const detail = document.createElement("aside");
    detail.className = "explore-detail";
    detail.hidden = true;
    detail.setAttribute("aria-live", "polite");
    detail.innerHTML =
        '<span class="eyebrow light">ВЫБЕРИТЕ БУХТУ НА КАРТЕ</span><strong></strong><p></p><a class="text-link pale">Открыть заметку ↗</a>';
    stage.append(detail);
    function closeExplore() {
        if (!exploring) return;
        exploring = false;
        document.body.classList.remove("is-exploring");
        close.hidden = true;
        detail.hidden = true;
        stage.removeAttribute("role");
        stage.removeAttribute("aria-modal");
        stage.setAttribute("aria-label", "Интерактивная карта Хайнаня");
        background.forEach((el) => (el.inert = false));
        document.body.append(dock);
        currentStep = "";
        syncScroll();
        exploreTrigger?.focus({ preventScroll: true });
    }
    document
        .querySelectorAll(".free-explore, [data-open-map]")
        .forEach(trigger => trigger.addEventListener("click", (event) => {
            exploreTrigger = event.currentTarget;
            exploring = true;
            document.body.classList.add("is-exploring");
            stage.setAttribute("role", "dialog");
            stage.setAttribute("aria-modal", "true");
            stage.setAttribute("aria-label", "Карта бухт Саньи");
            background.forEach((el) => (el.inert = true));
            stage.append(dock);
            close.hidden = false;
            detail.hidden = false;
            dock.hidden = false;
            layerControls.hidden = false;
            map.setScene("bays");
            if (event.currentTarget.hasAttribute("data-show-hotels")) setHotelLayer(true);
            selectArea(activeArea);
            close.focus({ preventScroll: true });
        }));
    close.addEventListener("click", closeExplore);
    document.addEventListener("keydown", (event) => {
        if (!exploring) return;
        if (event.key === "Escape") {
            event.preventDefault();
            closeExplore();
        }
        if (event.key === "Tab") {
            const focusable = [
                ...stage.querySelectorAll("button:not([hidden]),a[href]"),
            ].filter(
                (el) => el.getClientRects().length && !el.closest("[hidden]"),
            );
            const first = focusable[0],
                last = focusable.at(-1);
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        }
    });
    document.querySelectorAll(".site-header a").forEach((a) =>
        a.addEventListener("click", () => {
            if (exploring) closeExplore();
        }),
    );
}

function initSaved() {
    const section = document.getElementById("stay");
    const rows = [...document.querySelectorAll("[data-stay]")];
    if (!rows.length) return;
    const rowTags = new Map(rows.map((row) => [row, new Set(row.dataset.stayTags.trim().split(/\s+/))]));
    const valid = new Set(rows.map((row) => row.dataset.stay));
    const stored = storage.get("saved", []);
    const saved = new Set(
        Array.isArray(stored) ? stored.filter((slug) => valid.has(slug)) : [],
    );
    let filter = "all";
    let bay = "all";
    let savedOnly = false;
    const notice = section.querySelector(".save-notice");
    const savedFilter = section.querySelector("[data-stay-saved]");
    const empty = section.querySelector(".stay-empty");
    const results = section.querySelector("[data-stay-results]");
    function render() {
        document.getElementById("saved-count").textContent = saved.size;
        document.querySelectorAll("[data-save]").forEach((button) => {
            const active = saved.has(button.dataset.save);
            button.setAttribute("aria-pressed", String(active));
            button.querySelector(".save-symbol").textContent = active
                ? "✓"
                : "+";
            button.querySelector(".save-text").textContent = active
                ? "В списке"
                : "В список";
            button.setAttribute(
                "aria-label",
                (active ? "Убрать из списка " : "Сохранить ") +
                    button.closest("[data-stay]").querySelector("h3")
                        .textContent.trim(),
            );
        });
        document
            .querySelectorAll("[data-stay-filter]")
            .forEach((button) =>
                button.setAttribute(
                    "aria-pressed",
                    String(button.dataset.stayFilter === filter),
                ),
            );
        section.querySelectorAll("[data-stay-bay]").forEach((button) =>
            button.setAttribute("aria-pressed", String(button.dataset.stayBay === bay)),
        );
        savedFilter.setAttribute("aria-pressed", String(savedOnly));
        let visible = 0;
        rows.forEach((row) => {
            const tags = rowTags.get(row);
            row.hidden = !(
                (filter === "all" || tags.has(filter)) &&
                (bay === "all" || tags.has(bay)) &&
                (!savedOnly || saved.has(row.dataset.stay))
            );
            if (!row.hidden) visible += 1;
        });
        results.textContent = `${visible} из ${rows.length}`;
        empty.hidden = visible > 0;
        if (!visible) {
            empty.querySelector("[data-stay-empty-text]").textContent =
                savedOnly && !saved.size
                    ? "Ваш список пока пуст. Нажмите «В список» у вариантов, к которым хочется вернуться."
                    : savedOnly
                        ? "В вашем списке пока нет жилья с такими условиями. Попробуйте другую бухту или тип жилья."
                        : bay === "haitang-bay"
                            ? "Для Хайтанваня пока нет вариантов с такими условиями в этой подборке. Можно выбрать другую бухту."
                            : "В этой подборке пока нет жилья с таким сочетанием бухты и типа. Попробуйте изменить фильтры.";
        }
    }
    document.querySelectorAll("[data-save]").forEach((button) =>
        button.addEventListener("click", () => {
            const slug = button.dataset.save;
            const remove = saved.has(slug);
            if (remove) saved.delete(slug);
            else saved.add(slug);
            const persisted = storage.set("saved", [...saved]);
            render();
            if (button.closest("[data-stay]").hidden) savedFilter.focus({ preventScroll: true });
            notice.textContent = persisted
                ? remove
                    ? "Вариант убран из вашего списка."
                    : "Сохранено в вашем списке в этом браузере."
                : "Список обновлён. В этом браузере сохранение после закрытия недоступно.";
        }),
    );
    document.querySelectorAll("[data-stay-filter]").forEach((button) =>
        button.addEventListener("click", () => {
            filter = button.dataset.stayFilter;
            notice.textContent = "";
            render();
        }),
    );
    section.querySelectorAll("[data-stay-bay]").forEach((button) =>
        button.addEventListener("click", () => {
            bay = button.dataset.stayBay;
            notice.textContent = "";
            render();
        }),
    );
    savedFilter.addEventListener("click", () => {
        savedOnly = !savedOnly;
        notice.textContent = "";
        render();
    });
    section.querySelector("[data-stay-reset]").addEventListener("click", () => {
        filter = "all";
        bay = "all";
        savedOnly = false;
        notice.textContent = "";
        render();
        section.querySelector('[data-stay-filter="all"]').focus({ preventScroll: true });
    });
    render();
}
function initChecklist() {
    const inputs = [...document.querySelectorAll("[data-check]")];
    if (!inputs.length) return;
    const raw = storage.get("checks", []);
    const checked = new Set(Array.isArray(raw) ? raw : []);
    const update = () =>
        (document.getElementById("check-count").textContent = inputs.filter(
            (input) => input.checked,
        ).length);
    inputs.forEach((input) => {
        input.checked = checked.has(input.dataset.check);
        input.addEventListener("change", () => {
            storage.set(
                "checks",
                inputs.filter((i) => i.checked).map((i) => i.dataset.check),
            );
            update();
        });
    });
    update();
}
initDesktopGate(() => {
    initStory();
    initSaved();
    initChecklist();
    initJanuary();
});
