<template>
  <div class="page">
    <div class="intro">
      <div class="header">
        <div class="header-tag">Multi-Asset Portfolio Simulator</div>
        <h1 class="header-title">多資產組合模擬器</h1>
      </div>

      <section class="section">
        <h2>為什麼需要多資產組合？</h2>
        <p>
          「計算機」頁面幫你快速算出最早退休年齡，但它只有單一情境：<br />
          一份薪水、一筆基本開銷、一個退休時間點。<br /><br />
          現實生活往往更複雜——<br />
          你可能有副業收入、配偶薪資、子女教育費、房貸、投資帳戶⋯⋯<br />
          這些現金流在不同年齡區間此起彼落，單一模型很難完整描述。<br /><br />
          <strong>「多資產組合」</strong>就是為此而生：<br />
          把你的財務人生拆成多個群組，每個群組各自設定收入、支出、投資與提領計畫，<br />
          系統會把所有群組合併模擬，呈現完整的年度現金流與資產變化。
        </p>
      </section>

      <section class="section">
        <h2>核心概念</h2>
        <div class="card-grid">
          <div class="card">
            <h3>📂 群組 (Group Tabs)</h3>
            <p>
              每個群組代表一個人生階段或理財計畫。<br />
              例如：「工作期」放薪資與投資、「退休期」放 LMP 與 RP 提領。<br />
              群組可以重新命名、拖曳排序、新增或刪除。
            </p>
          </div>
          <div class="card">
            <h3>💵 收入 (Income)</h3>
            <p>
              設定年度收入金額、成長率，以及適用的年齡區間。<br />
              支援<strong>名目/實質</strong>切換，也可設為<strong>一次性</strong>收入（如遺產、獎金）。<br />
            </p>
          </div>
          <div class="card">
            <h3>🏷️ 支出 (Expense)</h3>
            <p>
              與收入格式相同，可設定年度支出、成長率與年齡區間。<br />
              適合記錄生活費、房貸、子女教育費、保險等各種週期性或一次性支出。
            </p>
          </div>
          <div class="card">
            <h3>📈 投資 (Investment)</h3>
            <p>
              設定投資帳戶的初始金額、報酬率與每月定期定額。<br />
              指定投入的年齡區間後，系統會計算到期時的帳戶終值，<br />
              做為退休時可動用的資金來源。
            </p>
          </div>
          <div class="card">
            <h3>🛡️ LMP — 負債匹配組合</h3>
            <p>
              同計算機頁面的 LMP 概念：用低風險工具鎖住基本生活費。<br />
              設定年度提領金額、TIPS 實質報酬率與提領年齡區間，<br />
              系統會算出退休當年需要準備多少 LMP 本金。
            </p>
          </div>
          <div class="card">
            <h3>📊 RP — 風險投資組合</h3>
            <p>
              同計算機頁面的 RP 概念：用成長型資產追求額外生活品質。<br />
              設定年度提領金額、預期報酬率與提領年齡區間，<br />
              系統會算出需要的 RP 本金，並以 ABW 方式動態調整每年提領。
            </p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>模擬結果</h2>
        <p>系統會將所有群組的項目合併計算，產出以下結果：</p>
        <div class="card-grid" style="margin-top: 12px">
          <div class="card">
            <h3>📊 四張圖表</h3>
            <p>
              <strong>現金流圖</strong>：各年齡的收入 vs 支出。<br />
              <strong>帳戶餘額</strong>：LMP / RP / 投資帳戶的逐年變化。<br />
              <strong>總資產趨勢</strong>：閒置資金 + 投資 + LMP + RP
              的合計曲線。<br />
              <strong>資產組成</strong>：堆疊長條圖呈現各資產類別的年度佔比。
            </p>
          </div>
          <div class="card">
            <h3>📑 明細表</h3>
            <p>
              逐年展開所有收入、支出、提領與帳戶餘額，<br />
              方便你核對每個年齡的現金流是否計算正確、符合預期。
            </p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>實用功能</h2>
        <div class="card-grid">
          <div class="card">
            <h3>💾 紀錄插槽</h3>
            <p>
              提供 3 個存檔插槽，可隨時儲存與切換不同的規劃版本。<br />
              每 5 秒自動存檔，也可以手動切換比較不同方案。
            </p>
          </div>
          <div class="card">
            <h3>📦 範本 / 匯入 / 匯出</h3>
            <p>
              內建多種範本（FIRE 型、上班族、雙薪家庭等），一鍵載入快速上手。<br />
              也可以匯出為 JSON 檔案分享，或匯入他人的規劃檔案。
            </p>
          </div>
          <div class="card">
            <h3>🔗 URL 分享</h3>
            <p>
              即時試算的所有設定都編碼在網址中，複製網址即可分享完整規劃。<br />
              對方打開連結就能看到一模一樣的模擬結果。
              <br /><br />
              僅「即時試算」會編碼在網址中；「紀錄1～3」存於本機，不會寫入連結。<br />
              可以透過「複製到」功能，將記錄放到即時試算中。
            </p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>系統限制</h2>
        <p>下列為介面上的硬性上限；若規劃規模很大，請搭配匯出 JSON 備份。</p>
        <dl class="glossary">
          <dt>群組與項目</dt>
          <dd>
            最多
            <strong>20</strong> 個群組。每個群組內，收入、支出、投資、LMP、RP
            五種類型<strong>各自</strong>最多
            <strong>100</strong> 筆（同一類型在第 101 筆時無法再新增）。
          </dd>
          <dt>紀錄插槽</dt>
          <dd>
            「即時試算」為目前編輯狀態；另有「紀錄
            1～3」三個會寫入瀏覽器本機的存檔位置，與網址列編碼分開。換裝置或清除網站資料後可能遺失，重要規劃請匯出檔案。
          </dd>
          <dt>網址列長度</dt>
          <dd>
            「URL 分享」將整份狀態以 JSON 編碼後寫入網址 hash（非 gzip
            壓縮）。項目與名稱很多時，連結會變得很長；若複製或開啟異常，請改以<strong
              >匯出 JSON</strong
            >傳遞。
          </dd>
        </dl>
      </section>

      <section class="section">
        <h2>如何使用</h2>
        <ol class="steps">
          <li>切換到<strong>「多資產組合」</strong>頁籤</li>
          <li>設定<strong>目前年齡、總資產與通膨率</strong></li>
          <li>在群組中新增<strong>收入、支出、投資、LMP、RP</strong> 項目</li>
          <li>依需要<strong>新增多個群組</strong>來區分人生階段</li>
          <li>
            觀察圖表與明細表，調整參數直到<strong
              >資金缺口歸零或出現盈餘</strong
            >
          </li>
          <li>也可以直接<strong>載入範本</strong>，在既有規劃上做調整</li>
        </ol>
      </section>

      <section class="section">
        <h2>名詞說明</h2>
        <dl class="glossary">
          <dt>名目金額 (Nominal)</dt>
          <dd>未扣除通膨的金額，也就是你帳戶上實際看到的數字。</dd>
          <dt>實質購買力 (Real)</dt>
          <dd>
            扣除通膨後、以今天的物價水準衡量的金額，反映你真正能買到多少東西。
          </dd>
          <dt>閒置資金 (Idle Assets)</dt>
          <dd>總資產中扣除投資帳戶、LMP、RP 本金後的剩餘資金，不產生報酬。</dd>
          <dt>淨現金流 (Net Flow)</dt>
          <dd>
            每年收入加上提領，減去支出與投資扣款後的餘額，反映該年度閒置資金的增減。
          </dd>
        </dl>
      </section>

      <div class="disclaimer">本工具僅供參考，不構成投資建議。</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(160deg, #0a0f1c 0%, #0f172a 40%, #111827 100%);
  color: #e8eaed;
  font-family: "DM Sans", sans-serif;
  padding: 24px 20px;
}
.intro {
  max-width: 720px;
  margin: 0 auto;
}
.header {
  text-align: center;
  margin-bottom: 28px;
}
.header-tag {
  font-size: 11px;
  letter-spacing: 4px;
  color: #60a5fa;
  text-transform: uppercase;
  margin-bottom: 6px;
  font-family: "Space Mono", monospace;
}
.header-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #e8eaed, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.section {
  margin-bottom: 32px;
}
.section h2 {
  font-size: 28px;
  font-weight: 700;
  color: #e8eaed;
  margin: 0 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #1e293b;
}
.section p {
  font-size: 20px;
  line-height: 1.8;
  color: #94a3b8;
  margin: 0;
}
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 16px;
}
.card h3 {
  font-size: 20px;
  font-weight: 700;
  color: #e8eaed;
  margin: 0 0 8px;
}
.card p {
  font-size: 20px;
  line-height: 1.7;
  color: #8a919e;
  margin: 0;
}
.steps {
  padding-left: 20px;
  color: #94a3b8;
  font-size: 15px;
  line-height: 2;
}
.steps strong {
  color: #e8eaed;
}
.glossary {
  margin: 0;
}
.glossary dt {
  font-size: 15px;
  font-weight: 700;
  color: #60a5fa;
  margin-top: 12px;
}
.glossary dt:first-child {
  margin-top: 0;
}
.glossary dd {
  margin: 4px 0 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: #8a919e;
}
.disclaimer {
  text-align: center;
  margin-top: 28px;
  padding: 16px 0;
  border-top: 1px solid #1e293b;
  font-size: 12px;
  color: #4b5563;
}
</style>
