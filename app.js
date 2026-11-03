let tabs = [];
let activeTabId = null;

const browserContainer = document.getElementById('browser-container');
const urlInput = document.getElementById('url-input');

const btnGo = document.getElementById('btn-go');
const btnReload = document.getElementById('btn-reload');
const btnHome = document.getElementById('btn-home');
const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');

// Elementos del conmutador de pestañas (Safari Grid)
const btnTabsToggle = document.getElementById('btn-tabs-toggle');
const tabsSwitcherOverlay = document.getElementById('tabs-switcher-overlay');
const tabsGridContainer = document.getElementById('tabs-grid-container');
const btnAddTabSwitcher = document.getElementById('btn-add-tab-switcher');
const btnCloseSwitcher = document.getElementById('btn-close-switcher');
const tabsCountBadge = document.getElementById('tabs-count-badge');

// Modal de Opciones
const optionsModal = document.getElementById('options-modal');
const btnOptionsTrigger = document.getElementById('btn-options-trigger');
const btnModalClose = document.getElementById('btn-modal-close');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalSave = document.getElementById('btn-modal-save');
const btnClearHistory = document.getElementById('btn-clear-history');

function createTab(url = null) {
    const tabId = 'tab-' + Date.now();
    const defaultHome = localStorage.getItem('netscape_homepage') || './home.html';
    const initialUrl = url || defaultHome;

    const iframeEl = document.createElement('iframe');
    iframeEl.className = 'tab-iframe';
    iframeEl.dataset.id = tabId;
    iframeEl.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    iframeEl.src = initialUrl;

    if (browserContainer) {
        browserContainer.appendChild(iframeEl);
    }

    const newTabObj = { id: tabId, title: 'Inicio Netscape', url: initialUrl, iframeEl };
    tabs.push(newTabObj);

    iframeEl.addEventListener('load', () => {
        try {
            let currentSrc = iframeEl.contentWindow.location.href;
            newTabObj.url = currentSrc;
            if (activeTabId === tabId) {
                urlInput.value = currentSrc.includes('home.html') ? './home.html' : currentSrc;
            }
            let pageTitle = iframeEl.contentDocument ? iframeEl.contentDocument.title : 'Pestaña';
            if (pageTitle && !pageTitle.includes('search.html')) {
                newTabObj.title = pageTitle;
            } else if (pageTitle.includes('search.html')) {
                newTabObj.title = 'Búsqueda';
            }
            renderTabsGrid();
        } catch(e) {}
    });

    switchTab(tabId);
    updateTabsBadge();
}

function switchTab(tabId) {
    activeTabId = tabId;
    tabs.forEach(t => {
        if (t.id === tabId) {
            t.iframeEl.classList.add('active');
            try {
                let currentSrc = t.iframeEl.src;
                urlInput.value = currentSrc.includes('home.html') ? './home.html' : currentSrc;
            } catch(e) {}
        } else {
            t.iframeEl.classList.remove('active');
        }
    });
    renderTabsGrid();
}

function closeTab(tabId) {
    if (tabs.length === 1) {
        const defaultHome = localStorage.getItem('netscape_homepage') || './home.html';
        tabs[0].iframeEl.src = defaultHome;
        tabs[0].title = 'Inicio Netscape';
        renderTabsGrid();
        return;
    }
    const index = tabs.findIndex(t => t.id === tabId);
    if (index !== -1) {
        tabs[index].iframeEl.remove();
        tabs.splice(index, 1);
        switchTab(tabs[Math.max(0, index - 1)].id);
    }
    updateTabsBadge();
}

function updateTabsBadge() {
    if (tabsCountBadge) {
        tabsCountBadge.textContent = tabs.length;
    }
}

function renderTabsGrid() {
    if (!tabsGridContainer) return;
    tabsGridContainer.innerHTML = '';

    tabs.forEach(tab => {
        const card = document.createElement('div');
        card.className = `tab-card ${tab.id === activeTabId ? 'active' : ''}`;
        
        card.innerHTML = `
            <div class="tab-card-header">
                <span class="tab-card-title">${tab.title}</span>
                <span class="tab-card-close" data-id="${tab.id}">&#10005;</span>
            </div>
            <div class="tab-card-preview">
                <span>${tab.title}</span>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-card-close')) {
                e.stopPropagation();
                closeTab(tab.id);
            } else {
                switchTab(tab.id);
                toggleTabsSwitcher(false);
            }
        });

        tabsGridContainer.appendChild(card);
    });
}

function toggleTabsSwitcher(show) {
    if (show) renderTabsGrid();
    tabsSwitcherOverlay.classList.toggle('active', show);
}

function getActiveIframe() {
    const active = tabs.find(t => t.id === activeTabId);
    return active ? active.iframeEl : null;
}

function navigate() {
    const iframe = getActiveIframe();
    if (!iframe) return;

    let query = urlInput.value.trim();
    if (!query) return;

    let targetUrl = query;

    if (!query.startsWith('http://') && !query.startsWith('https://') && query !== './home.html' && query !== 'home.html' && !query.startsWith('search.html')) {
        if (query.includes('.') && !query.includes(' ')) {
            targetUrl = 'https://' + query;
        } else {
            targetUrl = `./search.html?q=${encodeURIComponent(query)}`;
        }
    }
    
    saveHistory(query);
    iframe.src = targetUrl;
}

function saveHistory(query) {
    let history = JSON.parse(localStorage.getItem('netscape_app_history')) || [];
    history.unshift({ query, time: new Date().toLocaleTimeString() });
    if (history.length > 15) history.pop();
    localStorage.setItem('netscape_app_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('app-history-list');
    if (!list) return;
    let history = JSON.parse(localStorage.getItem('netscape_app_history')) || [];
    list.innerHTML = "";
    if (history.length === 0) {
        list.innerHTML = "<li style='color: #888; font-size: 9px; padding: 4px;'>Sin historial</li>";
        return;
    }
    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `<span>&#9903; ${item.query}</span><span>${item.time}</span>`;
        li.onclick = () => {
            urlInput.value = item.query;
            navigate();
            toggleModal(false);
        };
        list.appendChild(li);
    });
}

function clearHistory() {
    localStorage.removeItem('netscape_app_history');
    renderHistory();
}

function toggleModal(show) {
    if (show) renderHistory();
    optionsModal.style.display = show ? 'flex' : 'none';
}

// Event Listeners
if (btnGo) btnGo.addEventListener('click', navigate);
if (urlInput) urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(); });

if (btnTabsToggle) btnTabsToggle.addEventListener('click', () => toggleTabsSwitcher(true));
if (btnCloseSwitcher) btnCloseSwitcher.addEventListener('click', () => toggleTabsSwitcher(false));
if (btnAddTabSwitcher) btnAddTabSwitcher.addEventListener('click', () => {
    createTab();
    toggleTabsSwitcher(false);
});

if (btnReload) btnReload.addEventListener('click', () => {
    const iframe = getActiveIframe();
    if (iframe) iframe.src = iframe.src;
});

if (btnHome) btnHome.addEventListener('click', () => {
    const iframe = getActiveIframe();
    if (iframe) iframe.src = localStorage.getItem('netscape_homepage') || './home.html';
});

if (btnBack) btnBack.addEventListener('click', () => {
    const iframe = getActiveIframe();
    try { iframe.contentWindow.history.back(); } catch(e) {}
});

if (btnForward) btnForward.addEventListener('click', () => {
    const iframe = getActiveIframe();
    try { iframe.contentWindow.history.forward(); } catch(e) {}
});

if (btnOptionsTrigger) btnOptionsTrigger.addEventListener('click', () => toggleModal(true));
if (btnModalClose) btnModalClose.addEventListener('click', () => toggleModal(false));
if (btnModalCancel) btnModalCancel.addEventListener('click', () => toggleModal(false));
if (btnClearHistory) btnClearHistory.addEventListener('click', clearHistory);

if (btnModalSave) {
    btnModalSave.addEventListener('click', () => {
        const engine = document.getElementById('setting-engine').value;
        const homepage = document.getElementById('setting-homepage').value;
        localStorage.setItem('netscape_engine', engine);
        if (homepage) {
            localStorage.setItem('netscape_homepage', homepage);
        }
        toggleModal(false);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const savedEngine = localStorage.getItem('netscape_engine') || 'google';
    const savedHomepage = localStorage.getItem('netscape_homepage') || './home.html';
    
    document.getElementById('setting-engine').value = savedEngine;
    document.getElementById('setting-homepage').value = savedHomepage;
    
    createTab();
});