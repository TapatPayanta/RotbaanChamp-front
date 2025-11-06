// load header/footer and initialize header behavior after mount

export async function mountPartials() {
    const [hdr, ftr] = await Promise.all([
        fetch("/components/header.html").then(r => r.text()),
        fetch("/components/footer.html").then(r => r.text()),
    ]);

    document.getElementById("header").innerHTML = hdr;
    document.getElementById("footer").innerHTML = ftr;

    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    // init header behaviors now that header is in the DOM
    initHeader();
}

// initialize header: mobile toggle, close handlers, active nav
function initHeader() {
    // --- mark active nav links (desktop + mobile)
    (function markActiveNav() {
        const path = window.location.pathname.split("/").pop() || "index.html";
        const anchors = document.querySelectorAll("#header nav a, #header [aria-label='Mobile'] a");
        anchors.forEach(a => {
            const href = a.getAttribute("href") || "";
            // basic matching: endsWith page file or matches root/index
            if (
                href.endsWith(path) ||
                (path === "" && (href === "/" || href.endsWith("index.html"))) ||
                (href === "/" && path === "index.html")
            ) {
                a.classList.add("text-[color:var(--warm-rust)]", "font-semibold");
            } else {
                a.classList.remove("text-[color:var(--warm-rust)]", "font-semibold");
            }
        });
    })();

    // --- mobile toggle + close behaviors
    const mobileToggle = document.getElementById("mobile-nav-toggle");
    const mobileMenu = document.getElementById("mobile-nav");
    const openIcon = document.getElementById("hamburger-open");
    const closeIcon = document.getElementById("hamburger-close");

    // helper to close
    function closeMenu() {
        if (!mobileMenu || mobileMenu.classList.contains("hidden")) return;
        mobileMenu.classList.add("hidden");
        if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "false");
        if (openIcon) openIcon.classList.remove("hidden");
        if (closeIcon) closeIcon.classList.add("hidden");
        // restore fixed positioning behavior (no-op if not changed)
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
    }

    function openMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove("hidden");
        if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "true");
        if (openIcon) openIcon.classList.add("hidden");
        if (closeIcon) closeIcon.classList.remove("hidden");
        // lock page scroll when menu open to keep panel fixed in place
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        // focus first link
        const first = mobileMenu.querySelector("a");
        if (first) first.focus();
    }

    // attach toggle handler (delegated safety)
    document.addEventListener("click", (ev) => {
        const toggle = ev.target.closest("#mobile-nav-toggle");
        if (!toggle) return;
        // toggle
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        if (isOpen) closeMenu();
        else openMenu();
    });

    // close on Escape
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        closeMenu();
    });

    // click outside to close (when open)
    document.addEventListener("click", (ev) => {
        if (!mobileMenu || mobileMenu.classList.contains("hidden")) return;
        const clickedInside = ev.target.closest("#mobile-nav") || ev.target.closest("#mobile-nav-toggle");
        if (!clickedInside) closeMenu();
    });

    // ensure menu hides when resizing to desktop
    window.addEventListener("resize", () => {
        if (!mobileMenu) return;
        if (window.innerWidth >= 768) {
            closeMenu();
        }
    });

    // also close menu when a mobile link is clicked (good UX)
    if (mobileMenu) {
        mobileMenu.addEventListener("click", (ev) => {
            const a = ev.target.closest("a");
            if (a) closeMenu();
        }, { capture: true });
    }
}