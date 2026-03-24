# 角色文檔網站原型

這是可直接部署到 GitHub Pages 的前端原型，包含：

- 左側分類頁籤（文檔、關鍵詞）
- 文檔大分類（目前：深海的筆記 / 吉祥物）
- 關鍵詞與文檔按鈕使用自適應膠囊標籤（依文字長度縮放，自動換行排序）
- 右側文檔預覽
- 文內關鍵詞特殊標記（紅色粗體、可點擊）
- 網頁內訊息列（取代彈跳式 alert）
- 條件解鎖
  - 收集關鍵詞可開啟新文檔
  - 在關鍵詞頁面把關鍵詞當作「道具」點擊，才會觸發當前文檔隱藏內容
- 進度儲存在瀏覽器 localStorage
- 底部「重置存檔（測試）」按鈕可清空目前進度
- 工具列版本號顯示（`window.APP_DATA.version`）

## 版本規則

- 顯示格式：`ver. 0.001`
- 每次更新可將 `data.js` 中的 `version` 手動 + `0.001`

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
