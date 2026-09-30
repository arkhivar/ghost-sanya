const WATER_COPY = {
    22: {title: "Бодряще. И не для всех комфортно.", body: "+22 °C может ощущаться прохладно. Я не считаю эту цифру универсальной границей комфорта и не задаю себе или детям «безопасный таймер»."},
    23: {title: "Море, а не тёплый бассейн.", body: "Около +23 °C — близко к историческому январскому ориентиру. Кому-то приятно плавать, кому-то прохладно: комфорт индивидуален."},
    24: {title: "Чуть теплее — не значит безусловно комфортно.", body: "+24 °C теплее соседних примеров. Но самочувствие, погода, волны и условия на пляже по-прежнему важнее одной цифры."},
};
export default function initJanuary() {
    const demo = document.querySelector("[data-weather-demo]");
    if (!demo) return;
    let water = "23", wind = "calm";
    const render = () => {
        demo.dataset.water = water;
        demo.dataset.wind = wind;
        demo.querySelector("[data-water-display]").textContent = `+${water}°`;
        demo.querySelector("[data-weather-title]").textContent = WATER_COPY[water].title;
        demo.querySelector("[data-weather-copy]").textContent = WATER_COPY[water].body;
        demo.querySelector("[data-weather-wind]").textContent = wind === "breeze"
            ? "На ветру после выхода из воды может стать холоднее. Я приготовлю сухое полотенце и одежду. Вода остаётся той же температуры; прохладнее может ощущаться именно выход на берег."
            : "Без ветра выходить на берег может быть приятнее. Но тишина на берегу не подтверждает безопасность воды.";
        demo.querySelectorAll("[data-water-choice]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.waterChoice === water)));
        demo.querySelectorAll("[data-wind-choice]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.windChoice === wind)));
    };
    demo.querySelectorAll("[data-water-choice]").forEach(button => button.addEventListener("click", () => {water = button.dataset.waterChoice; render();}));
    demo.querySelectorAll("[data-wind-choice]").forEach(button => button.addEventListener("click", () => {wind = button.dataset.windChoice; render();}));
}
