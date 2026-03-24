const STORAGE_KEY = "rakuenmeno_progress_v2";

const state = {
  currentDocId: null,
  collectedKeywords: [],
  activatedKeywordsByDoc: {}
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    state.collectedKeywords = Array.isArray(parsed.collectedKeywords)
      ? parsed.collectedKeywords
      : [];
    state.activatedKeywordsByDoc = parsed.activatedKeywordsByDoc || {};
  } catch {
    state.collectedKeywords = [];
    state.activatedKeywordsByDoc = {};
  }
}

function saveProgress() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      collectedKeywords: state.collectedKeywords,
      activatedKeywordsByDoc: state.activatedKeywordsByDoc
    })
  );
}

function showMessage(message, type = "info") {
  const box = document.getElementById("inline-message");
  if (!box) return;

  box.textContent = message;
  box.classList.remove("is-hidden", "is-success", "is-warning");

  if (type === "success") box.classList.add("is-success");
  if (type === "warning") box.classList.add("is-warning");
}

function hasKeywords(required = [], sourceKeywords = state.collectedKeywords) {
  return required.every((keyword) => sourceKeywords.includes(keyword));
}

function getVisibleDocs() {
  return window.APP_DATA.docs.filter((doc) => hasKeywords(doc.requires));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderTabs() {
  const tabButtons = document.querySelectorAll(".tab");
  const docsPanel = document.getElementById("panel-docs");
  const keywordsPanel = document.getElementById("panel-keywords");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("is-active"));
      button.classList.add("is-active");

      const isDocs = button.dataset.tab === "docs";
      docsPanel.classList.toggle("is-hidden", !isDocs);
      keywordsPanel.classList.toggle("is-hidden", isDocs);
    });
  });
}

function groupDocsBySection(docs) {
  return docs.reduce((acc, doc) => {
    const key = doc.section || "未分類";
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});
}

function renderDocList() {
  const container = document.getElementById("doc-list");
  container.innerHTML = "";

  const visibleDocs = getVisibleDocs();
  const groups = groupDocsBySection(visibleDocs);

  Object.entries(groups).forEach(([sectionName, docs]) => {
    const section = document.createElement("section");
    section.className = "doc-group";

    const heading = document.createElement("h3");
    heading.className = "doc-group-title";
    heading.textContent = sectionName;
    section.appendChild(heading);

    const list = document.createElement("div");
    list.className = "tag-wrap";

    docs.forEach((doc) => {
      const btn = document.createElement("button");
      btn.className = "tag-btn";
      btn.textContent = `${doc.title}`;
      btn.title = `分類：${doc.category}`;
      btn.addEventListener("click", () => openDoc(doc.id));
      list.appendChild(btn);
    });

    section.appendChild(list);
    container.appendChild(section);
  });

  if (!visibleDocs.some((doc) => doc.id === state.currentDocId)) {
    state.currentDocId = visibleDocs.length > 0 ? visibleDocs[0].id : null;
  }

  if (state.currentDocId) {
    openDoc(state.currentDocId);
  }
}

function renderKeywordList() {
  const list = document.getElementById("keyword-list");
  list.innerHTML = "";

  if (state.collectedKeywords.length === 0) {
    const li = document.createElement("li");
    li.className = "hint-line";
    li.textContent = "尚未收集任何關鍵詞";
    list.appendChild(li);
    return;
  }

  state.collectedKeywords.forEach((keyword) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.className = "inventory-item tag-btn";
    button.textContent = `✦ ${keyword}`;
    button.title = "在開啟文檔時點擊以嘗試觸發反應";
    button.addEventListener("click", () => activateKeyword(keyword));
    li.appendChild(button);
    list.appendChild(li);
  });
}

function collectKeyword(keyword) {
  if (state.collectedKeywords.includes(keyword)) return;

  state.collectedKeywords.push(keyword);
  saveProgress();
  renderKeywordList();
  renderDocList();
  showMessage(`取得關鍵詞：${keyword}`, "success");
}

function activateKeyword(keyword) {
  if (!state.currentDocId) {
    showMessage("請先打開一份文檔。", "warning");
    return;
  }

  const doc = window.APP_DATA.docs.find((item) => item.id === state.currentDocId);
  if (!doc) return;

  const relatedHidden = doc.hiddenSections.filter((section) =>
    section.requires.includes(keyword)
  );

  if (relatedHidden.length === 0) {
    showMessage(`「${keyword}」沒有反應。`, "warning");
    return;
  }

  const activated = state.activatedKeywordsByDoc[doc.id] || [];
  if (!activated.includes(keyword)) {
    activated.push(keyword);
    state.activatedKeywordsByDoc[doc.id] = activated;
    saveProgress();
  }

  openDoc(doc.id);
  showMessage(`「${keyword}」產生了反應，文檔內容已更新。`, "success");
}

function markCollectableKeywords(text, keywords) {
  let output = text;

  keywords.forEach((keyword) => {
    const regex = new RegExp(escapeRegExp(keyword), "g");
    output = output.replace(
      regex,
      `<button class="inline-keyword" data-keyword="${keyword}">${keyword}</button>`
    );
  });

  return output;
}

function renderHiddenSections(doc) {
  if (!doc.hiddenSections || doc.hiddenSections.length === 0) {
    return "<p>（此文檔目前沒有隱藏段落）</p>";
  }

  const activated = state.activatedKeywordsByDoc[doc.id] || [];

  return doc.hiddenSections
    .map((section, index) => {
      const unlockedByActivation = hasKeywords(section.requires, activated);
      const ownedButNotActivated =
        hasKeywords(section.requires, state.collectedKeywords) && !unlockedByActivation;

      if (unlockedByActivation) {
        return `<p><strong>隱藏內容 ${index + 1}：</strong>${section.content}</p>`;
      }

      if (ownedButNotActivated) {
        return `<p>（隱藏內容 ${index + 1}：你持有關鍵詞，但需要到「關鍵詞頁面」點擊觸發）</p>`;
      }

      return `<p>（隱藏內容 ${index + 1}：尚未滿足條件）</p>`;
    })
    .join("");
}

function openDoc(docId) {
  const doc = window.APP_DATA.docs.find((item) => item.id === docId);
  if (!doc) return;

  state.currentDocId = docId;

  const title = document.getElementById("doc-title");
  const meta = document.getElementById("doc-meta");
  const content = document.getElementById("doc-content");

  title.textContent = doc.title;
  meta.textContent = `大分類：${doc.section}｜分類：${doc.category}`;

  const markedBody = markCollectableKeywords(doc.body, doc.keywords);
  const hiddenBlock = renderHiddenSections(doc);

  content.innerHTML = `
    <p>${markedBody}</p>
    <p class="hint">紅色粗體關鍵詞可點擊取得；取得後可到「關鍵詞頁面」作為道具點擊觸發反應。</p>
    ${hiddenBlock}
  `;

  content.querySelectorAll(".inline-keyword").forEach((button) => {
    button.addEventListener("click", () => {
      collectKeyword(button.dataset.keyword);
    });
  });
}

function resetProgress() {
  const confirmed = confirm("確定要重置目前瀏覽器中的測試存檔嗎？此動作無法復原。");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  state.collectedKeywords = [];
  state.activatedKeywordsByDoc = {};
  state.currentDocId = null;

  renderKeywordList();
  renderDocList();
  showMessage("已重置存檔。", "warning");
}

function setupResetButton() {
  const button = document.getElementById("reset-progress");
  if (!button) return;
  button.addEventListener("click", resetProgress);
}

function setupWorldlineButton() {
  const button = document.getElementById("switch-worldline");
  button.addEventListener("click", () => {
    showMessage("世界觀切換功能預留中（目前固定主世界）。", "info");
  });
}

function renderVersion() {
  const versionNode = document.getElementById("app-version");
  if (!versionNode) return;

  const version = window.APP_DATA.version || "0.001";
  versionNode.textContent = `ver. ${version}`;
}

function init() {
  loadProgress();
  renderTabs();
  renderVersion();
  renderKeywordList();
  renderDocList();
  setupResetButton();
  setupWorldlineButton();
}

init();
