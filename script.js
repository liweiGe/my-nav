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

// ========== 热点资讯 ==========
const TRENDING_API = 'https://dailyhot.hkg1.zeabur.app';
const TRENDING_APIS = [
    'https://dailyhot.hkg1.zeabur.app',
    'https://api-hot.efefee.cn'
];

const TRENDING_CONFIG = {
    weibo:    { name: '微博热搜', color: '#ff4d4f' },
    zhihu:    { name: '知乎热榜', color: '#0084ff' },
    baidu:    { name: '百度热搜', color: '#306cff' },
    bilibili: { name: 'B站热门',  color: '#fb7299' },
    douyin:   { name: '抖音热搜', color: '#111' },
    toutiao:  { name: '头条热榜', color: '#ff4d4f' },
    '36kr':   { name: '36氪热榜', color: '#0478f2' },
    ithome:   { name: 'IT之家',   color: '#d32f2f' }
};

let currentTrending = 'weibo';
let trendingCache = {};

const trendingList = document.getElementById('trendingList');
const trendingLoading = document.getElementById('trendingLoading');
const trendingError = document.getElementById('trendingError');
const trendingUpdateTime = document.getElementById('trendingUpdateTime');
const refreshBtn = document.getElementById('refreshBtn');
const retryBtn = document.getElementById('retryBtn');
const trendingTabs = document.querySelectorAll('.trending-tab');

async function fetchTrending(type, forceRefresh) {
    // 检查缓存 (5分钟有效)
    if (!forceRefresh && trendingCache[type] && (Date.now() - trendingCache[type].time < 300000)) {
        renderTrending(trendingCache[type].data);
        trendingUpdateTime.textContent = '更新于 ' + new Date(trendingCache[type].time).toLocaleTimeString('zh-CN');
        return;
    }

    trendingList.classList.add('hidden');
    trendingError.classList.remove('visible');
    trendingLoading.classList.remove('hidden');

    for (const apiBase of TRENDING_APIS) {
        try {
            const res = await fetch(apiBase + '/' + type + '?cache=false');
            if (!res.ok) continue;
            const json = await res.json();
            const items = json.data || [];
            if (items.length === 0) continue;

            trendingCache[type] = { data: items, time: Date.now() };
            renderTrending(items);
            trendingUpdateTime.textContent = '更新于 ' + new Date().toLocaleTimeString('zh-CN');
            trendingLoading.classList.add('hidden');
            return;
        } catch (_) { /* try next API */ }
    }

    // 所有 API 都失败
    trendingLoading.classList.add('hidden');
    trendingError.classList.add('visible');
}

function renderTrending(items) {
    const list = items.slice(0, 30);
    trendingList.innerHTML = list.map((item, i) => {
        const rank = i + 1;
        const rankClass = rank <= 3 ? ' top-' + rank : '';
        const title = escapeHtml(item.title || '');
        const hot = item.hot ? formatHot(item.hot) : '';
        const url = item.url || item.mobileUrl || '#';
        return '<a class="trending-item" href="' + url + '" target="_blank" rel="noopener">' +
            '<span class="trending-rank' + rankClass + '">' + rank + '</span>' +
            '<span class="trending-title">' + title + '</span>' +
            (hot ? '<span class="trending-hot">' + hot + '</span>' : '') +
            '</a>';
    }).join('');
    trendingList.classList.remove('hidden');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatHot(num) {
    if (typeof num === 'string') num = parseInt(num, 10);
    if (isNaN(num)) return '';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return String(num);
}

// Tab 切换
trendingTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        trendingTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTrending = tab.dataset.type;
        fetchTrending(currentTrending, false);
    });
});

// 刷新
refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    fetchTrending(currentTrending, true).finally(() => {
        setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
    });
});

// 重试
retryBtn.addEventListener('click', () => {
    fetchTrending(currentTrending, true);
});

// 初始加载
fetchTrending('weibo', false);

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
