let tabs = [];
let activeTabId = null;

const tabContainer = document.getElementById('tab-container');
const browserContainer = document.getElementById('browser-container');
const btnNewTab = document.getElementById('btn-new-tab');
const urlInput = document.getElementById('url-input');

const btnGo = document.getElementById('btn-go');
const btnReload = document.getElementById('btn-reload');
const btnHome = document.getElementById('btn-home');
const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');

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

    const tabEl = document.createElement('div');
    tabEl.className = 'app-tab';
    tabEl.dataset.id = tabId;
    tabEl.innerHTML = `
        <span class="tab-title">Inicio Netscape</span>
        <span class="tab-close">✕</span>
    `;

    const iframeEl = document.createElement('iframe');
    iframeEl.className = 'tab-iframe';
    iframeEl.dataset.id = tabId;
    iframeEl.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    iframeEl.src = initialUrl;

    if (tabContainer && btnNewTab) {
        tabContainer.insertBefore(tabEl, btnNewTab);
    }
    if (browserContainer) {
        browserContainer.appendChild(iframeEl);
    }

    tabs.push({ id: tabId, tabEl, iframeEl });

    tabEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
            e.stopPropagation();
            closeTab(tabId);
        } else {
            switchTab(tabId);
        }
    });

    iframeEl.addEventListener('load', () => {
        if (activeTabId === tabId) {
            try {
                let currentSrc = iframeEl.contentWindow.location.href;
                urlInput.value = currentSrc.includes('home.html') ? './home.html' : currentSrc;
            } catch(e) {}
        }
    });

    switchTab(tabId);
}

function switchTab(tabId) {
    activeTabId = tabId;
    tabs.forEach(t => {
        if (t.id === tabId) {
            t.tabEl.classList.add('active');
            t.iframeEl.classList.add('active');
            try {
                let currentSrc = t.iframeEl.src;
                urlInput.value = currentSrc.includes('home.html') ? './home.html' : currentSrc;
            } catch(e) {}
        } else {
            t.tabEl.classList.remove('active');
            t.iframeEl.classList.remove('active');
        }
    });
}

function closeTab(tabId) {
    if (tabs.length === 1) {
        const defaultHome = localStorage.getItem('netscape_homepage') || './home.html';
        tabs[0].iframeEl.src = defaultHome;
        return;
    }
    const index = tabs.findIndex(t => t.id === tabId);
    if (index !== -1) {
        tabs[index].tabEl.remove();
        tabs[index].iframeEl.remove();
        tabs.splice(index, 1);
        switchTab(tabs[Math.max(0, index - 1)].id);
    }
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
    const engine = localStorage.getItem('netscape_engine') || 'google';

    if (!query.startsWith('http://') && !query.startsWith('https://') && query !== './home.html' && query !== 'home.html') {
        if (query.includes('.') && !query.includes(' ')) {
            targetUrl = 'https://' + query;
        } else {
            if (engine === 'duckduckgo') targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            else if (engine === 'bing') targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
            else targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`;
        }
    }
    
    saveHistory(query);
    iframe.src = targetUrl;
}

function saveHistory(query) {
    let history = JSON.parse(localStorage.getItem('netscape_app_history')) || [];
    history.unshift({ query, time: new Date().toLocaleTimeString() });
    if (history.length > 10) history.pop();
    localStorage.setItem('netscape_app_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('app-history-list');
    let history = JSON.parse(localStorage.getItem('netscape_app_history')) || [];
    list.innerHTML = "";
    if (history.length === 0) {
        list.innerHTML = "<li style='color: #888; font-size: 9px; padding: 4px;'>Sin historial</li>";
        return;
    }
    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `<span>🔍 ${item.query}</span><span>${item.time}</span>`;
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

if (btnGo) btnGo.addEventListener('click', navigate);
if (urlInput) urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(); });
if (btnNewTab) btnNewTab.addEventListener('click', () => createTab());

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

btnOptionsTrigger.addEventListener('click', () => toggleModal(true));
btnModalClose.addEventListener('click', () => toggleModal(false));
btnModalCancel.addEventListener('click', () => toggleModal(false));
btnClearHistory.addEventListener('click', clearHistory);

btnModalSave.addEventListener('click', () => {
    const engine = document.getElementById('setting-engine').value;
    const homepage = document.getElementById('setting-homepage').value;
    localStorage.setItem('netscape_engine', engine);
    localStorage.setItem('netscape_homepage', homepage);
    toggleModal(false);
});

window.addEventListener('DOMContentLoaded', () => {
    const savedEngine = localStorage.getItem('netscape_engine') || 'google';
    document.getElementById('setting-engine').value = savedEngine;
    createTab();
});