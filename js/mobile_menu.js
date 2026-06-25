document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("mobileMenuBtn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (!btn || !sidebar || !overlay) {
        return;
    }

    btn.addEventListener("click", () => {
        sidebar.classList.add("sidebar-open");
        overlay.classList.add("overlay-active");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("sidebar-open");
        overlay.classList.remove("overlay-active");
    });

    const links = sidebar.querySelectorAll("a");

    links.forEach(link => {
        link.addEventListener("click", () => {
            sidebar.classList.remove("sidebar-open");
            overlay.classList.remove("overlay-active");
        });
    });
});