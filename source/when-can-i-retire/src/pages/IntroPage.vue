<template>
  <div class="page">
    <div class="intro">
      <div class="header">
        <div class="header-tag">LMP + RP(+ABW) Strategy</div>
        <h1 class="header-title">退休年齡計算機</h1>
      </div>

      <section class="section">
        <h2>大家有想過幾歲要退休嗎？</h2>
        <p>
          聊到退休，每個人的策略都有所不同 <br />
          有人每月固定買高股息 ETF，等配息夠生活就收工 <br />
          有人走 4% 提領路線，存到一筆錢後每年花本金的 4% <br />
          也有人打造多元現金流，像股息、債息、房租一起來，讓收入自己滾動
        </p>
        <p style="margin-top: 20px">
          這個計算機採用的是一套 <strong>LMP + RP (+ABW)</strong> 框架<br />
          1. 先用低風險工具鎖住基本生活費<br />
          2. 再用成長型資產追求生活品質<br />
          3. 最後透過攤還式提領讓資金花到最後一天
        </p>
      </section>

      <section class="section">
        <h2>核心策略</h2>
        <div class="card-grid">
          <div class="card">
            <h3>🛡️ LMP (Liability Matching Portfolio) — 負債匹配組合</h3>
            <p>
              提到「負債」，多數人第一時間會想到房貸。<br />
              <br />
              房貸的大致運作方式是：<br />
              1. 從銀行借出一筆錢（例如 500 萬，利率 2.6%）<br />
              2. 接下來 30 年間，每月固定償還 2 萬元（總計約 720 萬）<br />
              <br />
              如果換個角度，站在銀行的立場來看：<br />
              1. 銀行一開始先拿出 500 萬，借給客戶使用 <br />
              2. 接著在未來 30 年，每個月會收到一筆固定現金 2 萬元（總計約 720
              萬）<br />
              <br />
            </p>

            <p>
              在這套框架中，我們就扮演著銀行的角色<br />
              （例如：退休後還有 30 年、每月必須支出 2 萬元）<br />
              1. 在退休當年，先準備好 500 萬，投入一個年化實質報酬率約 2.6%
              的穩健投資組合 <br />
              2. 之後每月就能從這個組合提領 2 萬元來「支出生活費」，連續提領
              30 年，總金額約 720 萬 <br />
              <br />
              這就是所謂的：<br />
              負債匹配（Liability Matching）：對應每月 2 萬的必要支出 <br />
              組合（Portfolio）：用 500 萬、報酬率約 2.6%
              的投資組合來支撐這筆現金流 <br />
              <br />
            </p>

            <p>
              而 LMP 實務操作上，就可以買一些抗通膨債券 (例如
              TIPS、投資等級債；台灣常見替代作法是定存階梯或高評等債券梯)
              逐年匹配。 <br />
              (TIPS: Treasury Inflation-Protected
              Securities，美國財政部發行的抗通膨債券)
            </p>
          </div>
          <div class="card">
            <h3>📈 RP (Risk Portfolio) — 風險投資組合</h3>
            <p>
              扣掉 LMP 後剩下的錢，投入股票 ETF (如 0050、VT) 等成長性資產。
              <br />
              用來支付旅遊、興趣等額外花費，市場好時多花，市場差時少花。
            </p>
          </div>
          <div class="card">
            <h3>💰 ABW (Amortization Based Withdrawal) — 攤還式提領</h3>
            <p>
              最後 ABW 則提供一個公式，每年依 RP 餘額與剩餘年數計算提領金額。
              <br />
              <br />
              舉例來說，RP 有 500 萬，預計用 20 年，假設實質報酬 6%： <br />
              第 1 年：攤還計算後約可領 41 萬/年 (提領後餘額 459 萬) <br />
              第 2 年如果符合預期6%：帳戶變 487 萬 → 重算 → 約可領 41 萬/年
              (持平) <br />
              第 2 年如果市場大漲：帳戶變 600 萬 → 重算 → 約可領 51 萬/年
              (自動加薪) <br />
              第 2 年如果市場大跌：帳戶變 400 萬 → 重算 → 約可領 34 萬/年
              (自動減薪) <br />
            </p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>如何使用</h2>
        <ol class="steps">
          <li>切換到<strong>「計算機」</strong>頁籤</li>
          <li>輸入你的<strong>目前年齡、現金、每月存款</strong></li>
          <li>
            設定退休後的<strong>年度開支</strong>與<strong>年金收入</strong>
          </li>
          <li>調整<strong>報酬率與通膨</strong>假設</li>
          <li>
            系統會即時計算你的<strong>最早退休年齡</strong>，並以圖表呈現資產變化
          </li>
        </ol>
      </section>

      <section class="section">
        <h2>名詞說明</h2>
        <dl class="glossary">
          <dt>名目金額</dt>
          <dd>未扣除通膨的金額，也就是你帳戶上實際看到的數字。</dd>
          <dt>實質購買力</dt>
          <dd>
            扣除通膨後、以今天的物價水準衡量的金額，反映你真正能買到多少東西。
          </dd>
          <dt>TIPS 實質殖利率</dt>
          <dd>
            TIPS (Treasury Inflation-Protected Securities)
            是美國財政部發行的抗通膨債券，其實質殖利率代表扣除通膨後的無風險收益，是
            LMP 定價的關鍵參數。
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
.title {
  font-size: 36px;
  font-weight: 800;
  text-align: center;
  margin: 0 0 4px;
  background: linear-gradient(135deg, #e8eaed, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
.subtitle {
  text-align: center;
  font-size: 13px;
  letter-spacing: 3px;
  color: #60a5fa;
  text-transform: uppercase;
  font-family: "Space Mono", monospace;
  margin: 0 0 32px;
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
.card-icon {
  font-size: 24px;
  margin-bottom: 8px;
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
