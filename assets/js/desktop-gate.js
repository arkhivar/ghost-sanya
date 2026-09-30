const DESKTOP_BLOCK = "(max-width: 1023px), (hover: none) and (pointer: coarse)";

/** The prototype deliberately supports mouse/keyboard desktop browsing only. */
export default function initDesktopGate(startDesktop) {
    const blocked = window.matchMedia(DESKTOP_BLOCK);
    let started = false;
    const sync = () => {
        if (!blocked.matches && !started) {
            started = true;
            startDesktop();
        }
    };
    blocked.addEventListener("change", sync);
    document.querySelector("[data-copy-atlas]")?.addEventListener("click", async () => {
        const input = document.querySelector("#desktop-atlas-url");
        const status = document.querySelector("[data-copy-status]");
        try {
            await navigator.clipboard.writeText(input.value);
            status.textContent = "Ссылка скопирована.";
        } catch {
            input.focus();
            input.select();
            status.textContent = "Ссылка выделена — скопируйте её из поля.";
        }
    });
    sync();
}
