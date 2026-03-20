# 新頁面：多組 LMP / RP 投資多資產組合器

## 目標

建立一個獨立頁面，讓使用者自由建立**多組 LMP** 與**多組 RP**，
搭配多組收入來源，模擬退休後現金流。

與現有「退休年齡計算機」的差異：

- 計算機頁面：單一 LMP + 單一 RP，固定提領金額 → 算出最早退休年齡
- 新頁面：多組 LMP + 多組 RP + 多組收入來源 → 模擬退休後現金流

---

## 資料模型

### 收入來源

```ts
interface IncomeSource {
  id: string;
  label: string;          // 例如「勞保年金」「兼職收入」
  annualAmount: number;   // 每年收入金額
  amountBasis: ValueBasis; // 名目金額 or 實質購買力
  growthRate: number;     // 每年成長幅度（例如年金調整率）
  growthBasis: ValueBasis; // 名目成長 or 實質成長
  fromAge: number;        // 開始領取年齡
  toAge: number;          // 結束領取年齡
}
```

### LMP 群組

```ts
type ValueBasis = 'nominal' | 'real'; // 名目 or 實質

interface LmpGroup {
  id: string;
  label: string;          // 使用者自訂名稱，例如「基本生活費」
  rate: number;           // 殖利率
  rateBasis: ValueBasis;  // 名目利率 or 實質利率
  annualWithdraw: number; // 每年提領金額
  withdrawBasis: ValueBasis; // 名目金額 or 實質購買力
  fromAge: number;        // 開始提領年齡
  toAge: number;          // 結束提領年齡
  // requiredValue 由計算得出（唯讀）
  // 計算時統一轉換為實質值：若為名目，利率用 (1+r)/(1+inflation)-1，金額不變
}
```

### RP 群組

```ts
interface RpGroup {
  id: string;
  label: string;          // 例如「旅遊基金」「額外消費」
  rate: number;           // 報酬率
  rateBasis: ValueBasis;  // 名目報酬率 or 實質報酬率
  annualWithdraw: number; // 每年提領金額
  withdrawBasis: ValueBasis; // 名目金額 or 實質購買力
  fromAge: number;        // 開始提領年齡
  toAge: number;          // 結束提領年齡
  // requiredValue 由計算得出（唯讀）
}
```

### 投資

```ts
interface Investment {
  id: string;
  label: string;          // 例如「老年生活費儲備」
  rate: number;           // 報酬率
  rateBasis: ValueBasis;  // 名目 or 實質
  initialValue: number;   // 初始投入金額
  monthlyContribution: number; // 每月投資金額
  fromAge: number;        // 開始累積年齡
  toAge: number;          // 結束累積年齡
  // endValue 由計算得出（唯讀）：initialValue × (1+rate)^n + 定期定額終值
}
```

### 頁面層級輸入

```ts
interface PortfolioInputs {
  currentAge: number;
  totalAssets: number;    // 現有資產總額
  inflation: number;
  incomeSources: IncomeSource[]; // 收入來源（年金、兼職等）
  investments: Investment[];     // 投資  lmpGroups: LmpGroup[];
  rpGroups: RpGroup[];
}
```

---

## UI 結構

```
┌─────────────────────────────────────────────────────┐
│  NavBar（新增「多資產組合」tab）                        │
├─────────────────────────────────────────────────────┤
│  頁面標題 + 說明                                      │
├─────────────────────────────────────────────────────┤
│  全域參數（目前年齡 / 現有資產 / 通膨）                  │
├─────────────────────────┬───────────────────────────┤
│  收入列表                │  投資列表                   │
│  ┌─────────────────────┐│  ┌─────────────────────┐  │
│  │ {名稱}              ││  │ {名稱}              │  │
│  │ - 金額/年 [名目|實質]││  │ - 利率 [名目|實質]   │  │
│  │ - 成長幅度 [名目|實質]││  │ - 初始金額           │  │
│  │ - 開始時間(年初)     ││  │ - 每月投資金額       │  │
│  │ - 結束時間(年末)     ││  │ - 開始時間(年初)     │  │
│  └─────────────────────┘│  │ - 結束時間(年末)     │  │
│  [+ 新增收入]           │  │ - 到期金額(自動算)   │  │
│                         │  └─────────────────────┘  │
│                         │  [+ 新增投資]              │
├─────────────────────────┼───────────────────────────┤
│  LMP 群組列表            │  RP 群組列表               │
│  ┌─────────────────────┐│  ┌─────────────────────┐  │
│  │ {名稱}              ││  │ {名稱}              │  │
│  │ - 利率 [名目|實質]   ││  │ - 利率 [名目|實質]   │  │
│  │ - 提領金額 [名目|實質]││  │ - 提領金額 [名目|實質]│  │
│  │ - 開始時間(年初)     ││  │ - 開始時間(年初)     │  │
│  │ - 結束時間(年末)     ││  │ - 結束時間(年末)     │  │
│  │ - 所需金額(自動算)   ││  │ - 所需金額(自動算)   │  │
│  └─────────────────────┘│  └─────────────────────┘  │
│  [+ 新增 LMP]           │  [+ 新增 RP]              │
├─────────────────────────┴───────────────────────────┤
│  合計現金流圖表（堆疊長條圖）(三種樣式: 淨額(無色)、收入向上+支出向下、收入支出並排(+背景紅綠代表總合為正or負))         │
│  - X 軸：年齡                                         │
│  - Y 軸：金額                                         │
│  - 各 LMP/RP/收入/投資 用不同顏色堆疊                  │
├─────────────────────────────────────────────────────┤
│  各群組餘額走勢圖（折線圖）                        │
├─────────────────────────────────────────────────────┤
│  詳細提領表格                                         │
└─────────────────────────────────────────────────────┘
```

---

## 檔案規劃

```
src/
├── pages/
│   └── PortfolioSimulator.vue          # 新頁面主元件
├── components/
│   ├── common/                         # 既有共用元件
│   │   ├── SliderInput.vue
│   │   ├── SliderGroup.vue
│   │   └── NavBar.vue                  # 新增 tab: { key: "portfolio", label: "多資產組合" }
│   ├── calculator/                     # 既有計算機元件（不動）
│   └── portfolio/                      # 新頁面專屬元件
│       ├── IncomeSourceCard.vue         # 單一收入來源卡片
│       ├── InvestmentCard.vue          # 單一投資（純累積）卡片
│       ├── LmpGroupCard.vue            # 單一 LMP 群組卡片
│       ├── RpGroupCard.vue             # 單一 RP 群組卡片
│       ├── PortfolioChart.vue          # 合計現金流堆疊圖
│       ├── BalanceChart.vue            # 各群組餘額走勢
│       └── PortfolioTable.vue          # 詳細提領表格
├── composables/
│   ├── usePortfolioCalc.ts             # 多組 LMP/RP 計算邏輯
│   └── useRecordSlots.ts              # 既有（可共用紀錄功能）
├── types/
│   └── portfolio.ts                    # IncomeSource, LmpGroup, RpGroup, PortfolioInputs 等型別
└── utils/
    └── finance.ts                      # 既有，可能需擴充 calcLMP 支援分段提領
```

---

## 實作步驟

### Phase 1：基礎架構

1. 建立 `types/portfolio.ts` — 定義 IncomeSource, Investment, LmpGroup, RpGroup, PortfolioInputs 等型別
2. 建立 `pages/PortfolioSimulator.vue` — 空殼頁面
3. 更新 `NavBar.vue` — 新增「多資產組合」tab
4. 更新 `App.vue` — 路由加入新頁面

### Phase 2：群組 CRUD UI

1. 建立 `components/portfolio/IncomeSourceCard.vue` — 收入來源卡片
2. 建立 `components/portfolio/InvestmentCard.vue` — 投資（純累積）卡片
3. 建立 `components/portfolio/LmpGroupCard.vue` — LMP 群組卡片
4. 建立 `components/portfolio/RpGroupCard.vue` — RP 群組卡片
5. 整合到 PortfolioSimulator — 全域參數 + 收入來源 + 群組列表 + 新增/刪除

### Phase 3：計算引擎

1. 擴充 `utils/finance.ts` — 新增 LMP 固定提領的計算
2. 建立 `composables/usePortfolioCalc.ts` — 匯總多組 LMP/RP 的年度現金流與餘額

### Phase 4：視覺化

1. 建立 `components/portfolio/PortfolioChart.vue` — 堆疊長條圖（各群組提領）
2. 建立 `components/portfolio/BalanceChart.vue` — 折線圖（各群組餘額走勢）
3. 建立 `components/portfolio/PortfolioTable.vue` — 詳細數字表格

### Phase 5：收尾

1. 紀錄功能（useRecordSlots）適配新頁面
2. 響應式設計與手機適配
3. 邊界處理（餘額為負警示、收入 vs 支出缺口提示等）

---

## 設計決策備忘

- **LMP 與 RP 結構一致**：兩者皆為單一起止時間 + 固定年提領金額，差異僅在利率假設（LMP 用 TIPS 實質殖利率，RP 用股市實質報酬率）
- **收入來源獨立**：收入不綁定在 LMP/RP 群組，獨立管理，圖表中以正值呈現。不區分收入類型（年金、兼職等皆為同一種 IncomeSource），僅靠 label 區別
- **群組上限**：暫定 LMP 最多 5 組、RP 最多 5 組、收入來源最多 5 組，避免 UI 過於複雜
- **預設組合**：首次進入提供一組預設 LMP（基本生活費）+ 一組預設 RP（額外花費）+ 一組預設收入（年金），降低上手門檻
- **與計算機頁面獨立**：新頁面是獨立功能，不影響既有計算機邏輯

