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

// ========== 本地收藏系统 ==========
const bookmarkSection = document.getElementById('bookmarkSection');
const bookmarkGrid = document.getElementById('bookmarkGrid');
const bookmarkEmpty = document.getElementById('bookmarkEmpty');
const addBookmarkBtn = document.getElementById('addBookmarkBtn');
const bookmarkModal = document.getElementById('bookmarkModal');
const bookmarkModalClose = document.getElementById('bookmarkModalClose');
const bookmarkModalTitle = document.getElementById('bookmarkModalTitle');
const bmName = document.getElementById('bmName');
const bmUrl = document.getElementById('bmUrl');
const bmDesc = document.getElementById('bmDesc');
const bmIcon = document.getElementById('bmIcon');
const bmError = document.getElementById('bmError');
const bmSubmit = document.getElementById('bmSubmit');
const colorOpts = document.querySelectorAll('.color-opt');

let selectedColor = '#6366f1';
let editingIndex = -1;

function getBookmarks() {
    const raw = localStorage.getItem('nav-bookmarks');
    return raw ? JSON.parse(raw) : [];
}

function saveBookmarks(bookmarks) {
    localStorage.setItem('nav-bookmarks', JSON.stringify(bookmarks));
}

// --- 弹窗 ---
function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { modal.classList.remove('active'); }

bookmarkModalClose.addEventListener('click', () => closeModal(bookmarkModal));
bookmarkModal.addEventListener('click', e => { if (e.target === bookmarkModal) closeModal(bookmarkModal); });

// --- 渲染收藏 ---
function renderBookmarks() {
    const bookmarks = getBookmarks();
    bookmarkGrid.querySelectorAll('.nav-card').forEach(c => c.remove());
    if (bookmarks.length === 0) {
        bookmarkEmpty.style.display = '';
        return;
    }
    bookmarkEmpty.style.display = 'none';
    bookmarks.forEach((bm, idx) => {
        const card = document.createElement('a');
        card.className = 'nav-card';
        card.href = bm.url;
        card.target = '_blank';
        card.rel = 'noopener';
        card.innerHTML =
            '<div class="card-icon" style="background:' + escapeAttr(bm.color || '#6366f1') + '">' + escapeHtml(bm.icon || '⭐') + '</div>' +
            '<div class="card-info"><h3>' + escapeHtml(bm.name) + '</h3><p>' + escapeHtml(bm.desc || '') + '</p></div>' +
            '<button class="card-delete" data-idx="' + idx + '" title="删除">&times;</button>';
        bookmarkGrid.appendChild(card);
    });
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/[&"'<>]/g, c => ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' })[c]);
}

// 删除收藏（事件委托）
bookmarkGrid.addEventListener('click', e => {
    const del = e.target.closest('.card-delete');
    if (del) {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(del.dataset.idx, 10);
        const bookmarks = getBookmarks();
        if (idx >= 0 && idx < bookmarks.length) {
            bookmarks.splice(idx, 1);
            saveBookmarks(bookmarks);
            renderBookmarks();
        }
    }
});

// 颜色选择
colorOpts.forEach(opt => {
    opt.addEventListener('click', () => {
        colorOpts.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selectedColor = opt.dataset.color;
    });
});

// 打开添加收藏弹窗
addBookmarkBtn.addEventListener('click', () => {
    editingIndex = -1;
    bookmarkModalTitle.textContent = '添加收藏';
    bmName.value = '';
    bmUrl.value = '';
    bmDesc.value = '';
    bmIcon.value = '';
    bmError.textContent = '';
    selectedColor = '#6366f1';
    colorOpts.forEach(o => {
        o.classList.toggle('active', o.dataset.color === selectedColor);
    });
    openModal(bookmarkModal);
});

// 保存收藏
bmSubmit.addEventListener('click', () => {
    const name = bmName.value.trim();
    const url = bmUrl.value.trim();
    const desc = bmDesc.value.trim();
    const icon = bmIcon.value.trim() || '⭐';
    bmError.textContent = '';

    if (!name) { bmError.textContent = '请输入网站名称'; return; }
    if (!url) { bmError.textContent = '请输入网站地址'; return; }
    try { new URL(url); } catch (_) { bmError.textContent = '请输入有效的网址（以 http 开头）'; return; }

    const bookmarks = getBookmarks();
    const item = { name, url, desc, icon, color: selectedColor };

    if (editingIndex >= 0) {
        bookmarks[editingIndex] = item;
    } else {
        bookmarks.push(item);
    }
    saveBookmarks(bookmarks);
    closeModal(bookmarkModal);
    renderBookmarks();
});

// 初始渲染
renderBookmarks();

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
