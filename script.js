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
const MOMOYU_API = 'https://momoyu.cc/api/hot/list';

let currentTrending = 'weibo';
let momoyuData = null;
let momoyuFetchTime = 0;

const trendingList = document.getElementById('trendingList');
const trendingLoading = document.getElementById('trendingLoading');
const trendingError = document.getElementById('trendingError');
const trendingUpdateTime = document.getElementById('trendingUpdateTime');
const refreshBtn = document.getElementById('refreshBtn');
const retryBtn = document.getElementById('retryBtn');
const trendingTabs = document.querySelectorAll('.trending-tab');

async function fetchAllTrending(forceRefresh) {
    // 缓存 5 分钟
    if (!forceRefresh && momoyuData && (Date.now() - momoyuFetchTime < 300000)) {
        return momoyuData;
    }

    const res = await fetch(MOMOYU_API);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.status !== 100000 || !json.data) throw new Error('Invalid response');

    // 按 source_key 建立索引
    const map = {};
    json.data.forEach(function(platform) {
        map[platform.source_key] = platform.data || [];
    });
    momoyuData = map;
    momoyuFetchTime = Date.now();
    return map;
}

async function showTrending(type, forceRefresh) {
    trendingList.classList.add('hidden');
    trendingError.classList.remove('visible');
    trendingLoading.classList.remove('hidden');

    try {
        const data = await fetchAllTrending(forceRefresh);
        const items = data[type] || [];
        if (items.length === 0) throw new Error('No data');
        renderTrending(items);
        trendingUpdateTime.textContent = '更新于 ' + new Date(momoyuFetchTime).toLocaleTimeString('zh-CN');
        trendingLoading.classList.add('hidden');
    } catch (_) {
        trendingLoading.classList.add('hidden');
        trendingError.classList.add('visible');
    }
}

function renderTrending(items) {
    var list = items.slice(0, 30);
    trendingList.innerHTML = list.map(function(item, i) {
        var rank = i + 1;
        var rankClass = rank <= 3 ? ' top-' + rank : '';
        var title = escapeHtml(item.title || '');
        var hot = item.extra || '';
        var url = item.link || item.url || '#';
        return '<a class="trending-item" href="' + url + '" target="_blank" rel="noopener">' +
            '<span class="trending-rank' + rankClass + '">' + rank + '</span>' +
            '<span class="trending-title">' + title + '</span>' +
            (hot ? '<span class="trending-hot">' + escapeHtml(hot) + '</span>' : '') +
            '</a>';
    }).join('');
    trendingList.classList.remove('hidden');
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Tab 切换
trendingTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        trendingTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTrending = tab.dataset.type;
        showTrending(currentTrending, false);
    });
});

// 刷新
refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    showTrending(currentTrending, true).finally(() => {
        setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
    });
});

// 重试
retryBtn.addEventListener('click', () => {
    showTrending(currentTrending, true);
});

// 初始加载
showTrending('weibo', false);

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
