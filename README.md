# 角色文檔網站原型

這是可直接部署到 GitHub Pages 的前端原型，包含：

- 左側分類頁籤（筆記 / 文檔 / 關鍵詞）
- 筆記與文檔各自有清單與大分類
- 關鍵詞與清單按鈕使用自適應膠囊標籤（依文字長度縮放，自動換行）
- 文內關鍵詞特殊標記（紅色粗體、可點擊，字級與本文一致）
- 網頁內訊息列（取代彈跳式 alert）
- 筆記：可透過關鍵詞觸發隱藏內容
- 文檔：只提供關鍵詞，不與隱藏內容互動
- 進度儲存在瀏覽器 localStorage
- 底部「重置存檔（測試）」按鈕可清空目前進度
- 工具列版本號顯示（`window.APP_DATA.version`）

## 資料夾結構（新版）

```text
data/
  meta.js                # 版本與世界線
  notes-deep-sea.js      # 筆記：深海的筆記
  notes-mascot.js        # 筆記：吉祥物
  documents-deep-sea.js  # 文檔：深海的筆記
  index.js               # 組合成 window.APP_DATA
```

## 版本規則

- 顯示格式：`ver. 0.001`
- 每次更新可將 `data/meta.js` 中的 `version` 手動 + `0.001`
- 本次版本：`ver. 0.004`

## 本機預覽

### 方式 A：直接開啟
直接雙擊 `index.html`。

### 方式 B：啟動本機靜態伺服器（建議）
```bash
python3 -m http.server 8080
```
然後開啟 `http://localhost:8080`。

## GitHub Pages 預覽

1. 把程式推到 GitHub 倉庫
2. 在 GitHub 倉庫的 `Settings > Pages`
3. `Build and deployment` 選 `Deploy from a branch`
4. Branch 選 `main`（或你使用的分支）+ `/ (root)`
5. 儲存後等待 1~3 分鐘，會拿到公開網址
