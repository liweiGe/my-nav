// ========== 搜索引擎配置 ==========
const ENGINES = {
    baidu: 'https://www.baidu.com/s?wd=',
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    github: 'https://github.com/search?q='
};

let currentEngine = 'baidu';

// ========== DOM 元素 ==========
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const mainSearch = document.getElementById('mainSearch');
const searchBtn = document.getElementById('searchBtn');
const backToTop = document.getElementById('backToTop');
const engineBtns = document.querySelectorAll('.engine-btn');
const navSections = document.querySelectorAll('.nav-section');
const navCards = document.querySelectorAll('.nav-card');
const currentYear = document.getElementById('currentYear');

// ========== 年份 ==========
currentYear.textContent = new Date().getFullYear();

// ========== 主题切换 ==========
function initTheme() {
    const saved = localStorage.getItem('nav-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('nav-theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('nav-theme', 'dark');
    }
}

initTheme();
themeToggle.addEventListener('click', toggleTheme);

// ========== 搜索引擎切换 ==========
engineBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        engineBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentEngine = btn.dataset.engine;
        mainSearch.focus();
    });
});

// ========== 搜索功能 ==========
function performSearch() {
    const query = mainSearch.value.trim();
    if (query) {
        const url = ENGINES[currentEngine] + encodeURIComponent(query);
        window.open(url, '_blank', 'noopener');
    }
}

searchBtn.addEventListener('click', performSearch);
mainSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch();
});

// ========== 站内搜索过滤 ==========
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();

    navCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const desc = card.querySelector('p').textContent.toLowerCase();
        const match = !query || title.includes(query) || desc.includes(query);
        card.classList.toggle('hidden', !match);
    });

    // 隐藏没有可见卡片的分类
    navSections.forEach(section => {
        const visibleCards = section.querySelectorAll('.nav-card:not(.hidden)');
        section.classList.toggle('hidden', visibleCards.length === 0);
    });
});

// ========== 回到顶部 ==========
window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 300);
}, { passive: true });

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ========== 快捷键 ==========
document.addEventListener('keydown', e => {
    // Ctrl/Cmd + K 聚焦搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    // Escape 清空搜索
    if (e.key === 'Escape') {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.blur();
    }
});
