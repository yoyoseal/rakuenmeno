const STORAGE_KEY = "rakuenmeno_progress_v2";

const state = {
  currentItem: null,
  collectedKeywords: [],
  activatedKeywordsByNote: {},
  selectedNoteSection: null,
  selectedDocumentSection: null
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    state.collectedKeywords = Array.isArray(parsed.collectedKeywords)
      ? parsed.collectedKeywords
      : [];
    state.activatedKeywordsByNote = parsed.activatedKeywordsByNote || {};
  } catch {
    state.collectedKeywords = [];
    state.activatedKeywordsByNote = {};
  }
}

function saveProgress() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      collectedKeywords: state.collectedKeywords,
      activatedKeywordsByNote: state.activatedKeywordsByNote
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

function getVisibleNotes() {
  return window.APP_DATA.notes.filter((note) => hasKeywords(note.requires));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderTabs() {
  const tabButtons = document.querySelectorAll(".tab");
  const notesPanel = document.getElementById("panel-notes");
  const documentsPanel = document.getElementById("panel-documents");
  const keywordsPanel = document.getElementById("panel-keywords");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("is-active"));
      button.classList.add("is-active");

      const selected = button.dataset.tab;
      notesPanel.classList.toggle("is-hidden", selected !== "notes");
      documentsPanel.classList.toggle("is-hidden", selected !== "documents");
      keywordsPanel.classList.toggle("is-hidden", selected !== "keywords");
    });
  });
}

function groupBySection(items) {
  return items.reduce((acc, item) => {
    const key = item.section || "未分類";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function renderSectionedList({
  containerId,
  items,
  selectedSection,
  setSelectedSection,
  clickHandler,
  titleMapper,
  emptyText
}) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const groups = groupBySection(items);
  const sectionNames = Object.keys(groups);

  if (sectionNames.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint-line";
    empty.textContent = emptyText;
    container.appendChild(empty);
    return [];
  }

  const currentSection =
    selectedSection && groups[selectedSection] ? selectedSection : sectionNames[0];

  if (currentSection !== selectedSection) {
    setSelectedSection(currentSection);
  }

  const sectionBar = document.createElement("div");
  sectionBar.className = "section-bar";

  sectionNames.forEach((name) => {
    const btn = document.createElement("button");
    btn.className = `tag-btn section-btn ${name === currentSection ? "is-active" : ""}`;
    btn.textContent = name;
    btn.addEventListener("click", () => {
      setSelectedSection(name);
      renderNoteList();
      renderDocumentList();
    });
    sectionBar.appendChild(btn);
  });

  container.appendChild(sectionBar);

  const activeItems = groups[currentSection] || [];
  const list = document.createElement("div");
  list.className = "tag-wrap";

  activeItems.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
    btn.textContent = titleMapper(item);
    btn.addEventListener("click", () => clickHandler(item.id));
    list.appendChild(btn);
  });

  container.appendChild(list);
  return activeItems;
}

function renderNoteList() {
  const visibleNotes = getVisibleNotes();

  const activeNotes = renderSectionedList({
    containerId: "note-list",
    items: visibleNotes,
    selectedSection: state.selectedNoteSection,
    setSelectedSection: (value) => {
      state.selectedNoteSection = value;
    },
    clickHandler: openNote,
    titleMapper: (note) => note.title,
    emptyText: "目前沒有可顯示的筆記。"
  });

  const noteStillVisible = activeNotes.some(
    (note) => state.currentItem?.type === "note" && note.id === state.currentItem.id
  );

  if (!noteStillVisible && activeNotes.length > 0) {
    openNote(activeNotes[0].id);
  }
}

function renderDocumentList() {
  const documents = window.APP_DATA.documents;

  const activeDocs = renderSectionedList({
    containerId: "document-list",
    items: documents,
    selectedSection: state.selectedDocumentSection,
    setSelectedSection: (value) => {
      state.selectedDocumentSection = value;
    },
    clickHandler: openDocument,
    titleMapper: (file) => file.name,
    emptyText: "目前沒有可顯示的文檔。"
  });

  const docStillVisible = activeDocs.some(
    (file) => state.currentItem?.type === "document" && file.id === state.currentItem.id
  );

  if (!docStillVisible && activeDocs.length > 0 && !state.currentItem) {
    openDocument(activeDocs[0].id);
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
    button.title = "在開啟筆記時點擊以嘗試觸發反應";
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
  renderNoteList();
  showMessage(`取得關鍵詞：${keyword}`, "success");
}

function activateKeyword(keyword) {
  if (!state.currentItem || state.currentItem.type !== "note") {
    showMessage("請先打開一份筆記再嘗試觸發關鍵詞。", "warning");
    return;
  }

  const note = window.APP_DATA.notes.find((item) => item.id === state.currentItem.id);
  if (!note) return;

  const relatedHidden = note.hiddenSections.filter((section) =>
    section.requires.includes(keyword)
  );

  if (relatedHidden.length === 0) {
    showMessage(`「${keyword}」沒有反應。`, "warning");
    return;
  }

  const activated = state.activatedKeywordsByNote[note.id] || [];
  if (!activated.includes(keyword)) {
    activated.push(keyword);
    state.activatedKeywordsByNote[note.id] = activated;
    saveProgress();
  }

  openNote(note.id);
  showMessage(`「${keyword}」產生了反應，筆記內容已更新。`, "success");
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

function renderHiddenSections(note) {
  if (!note.hiddenSections || note.hiddenSections.length === 0) {
    return "<p>（此筆記目前沒有隱藏段落）</p>";
  }

  const activated = state.activatedKeywordsByNote[note.id] || [];

  return note.hiddenSections
    .map((section, index) => {
      const unlockedByActivation = hasKeywords(section.requires, activated);
      const ownedButNotActivated =
        hasKeywords(section.requires, state.collectedKeywords) && !unlockedByActivation;

      if (unlockedByActivation) {
        return `<p><strong>隱藏內容 ${index + 1}：</strong>${section.content}</p>`;
      }

      if (ownedButNotActivated) {
        return `<p>（隱藏內容 ${index + 1}：你持有關鍵詞，但需要到「關鍵詞」頁籤點擊觸發）</p>`;
      }

      return `<p>（隱藏內容 ${index + 1}：尚未滿足條件）</p>`;
    })
    .join("");
}

function openNote(noteId) {
  const note = window.APP_DATA.notes.find((item) => item.id === noteId);
  if (!note) return;

  state.currentItem = { type: "note", id: noteId };

  const title = document.getElementById("doc-title");
  const meta = document.getElementById("doc-meta");
  const content = document.getElementById("doc-content");

  title.textContent = note.title;
  meta.textContent = `類型：筆記｜大分類：${note.section}｜分類：${note.category}`;

  const markedBody = markCollectableKeywords(note.body, note.keywords);
  const hiddenBlock = renderHiddenSections(note);

  content.innerHTML = `
    <p>${markedBody}</p>
    <p class="hint">紅色粗體關鍵詞可點擊取得；取得後可到「關鍵詞」頁籤作為道具點擊觸發反應。</p>
    ${hiddenBlock}
  `;

  content.querySelectorAll(".inline-keyword").forEach((button) => {
    button.addEventListener("click", () => {
      collectKeyword(button.dataset.keyword);
    });
  });
}

function openDocument(documentId) {
  const file = window.APP_DATA.documents.find((item) => item.id === documentId);
  if (!file) return;

  state.currentItem = { type: "document", id: documentId };

  const title = document.getElementById("doc-title");
  const meta = document.getElementById("doc-meta");
  const content = document.getElementById("doc-content");

  title.textContent = file.name;
  meta.textContent = `類型：文檔｜大分類：${file.section}`;

  const markedBody = markCollectableKeywords(file.body, file.keywords);

  content.innerHTML = `
    <p>${markedBody}</p>
    <p class="hint">此區為文檔：只會提供關鍵詞，不會觸發隱藏內容互動。</p>
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
  state.activatedKeywordsByNote = {};
  state.currentItem = null;

  renderKeywordList();
  renderNoteList();
  renderDocumentList();
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
  renderNoteList();
  renderDocumentList();
  setupResetButton();
  setupWorldlineButton();
}

init();
