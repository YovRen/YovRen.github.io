(function () {
    const toggleId = 'theme-toggle';
    const storageKey = 'site-theme';
    const root = document.documentElement;

    function applyTheme(theme) {
        if (theme === 'dark') {
            root.style.setProperty('--bg-overlay', 'rgba(16,16,20,0.85)');
            root.style.setProperty('--text-color', '#eee');
            root.style.setProperty('--card-bg', '#151515');
            root.classList.add('dark');
        } else {
            root.style.setProperty('--bg-overlay', 'rgba(255,255,255,0.85)');
            root.style.setProperty('--text-color', '#111');
            root.style.setProperty('--card-bg', '#fff');
            root.classList.remove('dark');
        }
    }

    function init() {
        const saved = localStorage.getItem(storageKey) || 'light';
        applyTheme(saved);
        document.querySelectorAll('#' + toggleId).forEach(btn => {
            btn.addEventListener('click', () => {
                const current = localStorage.getItem(storageKey) || 'light';
                const next = current === 'dark' ? 'light' : 'dark';
                localStorage.setItem(storageKey, next);
                applyTheme(next);
                btn.setAttribute('aria-pressed', next === 'dark');
                btn.textContent = next === 'dark' ? '☀️' : '🌙';
            });
            // set initial label
            const cur = localStorage.getItem(storageKey) || 'light';
            btn.setAttribute('aria-pressed', cur === 'dark');
            btn.textContent = cur === 'dark' ? '☀️' : '🌙';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else init();
})();
