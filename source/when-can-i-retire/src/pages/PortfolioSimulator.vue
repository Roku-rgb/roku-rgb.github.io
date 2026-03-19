<script setup lang="ts">
import { ref } from 'vue'
import type { IncomeSource, ExpenseSource, Investment, LmpGroup, RpGroup } from '../types/portfolio'
import { usePortfolioCalc } from '../composables/usePortfolioCalc'
import { fmtMoney } from '../utils/format'
import SliderInput from '../components/common/SliderInput.vue'
import SliderGroup from '../components/common/SliderGroup.vue'
import IncomeSourceCard from '../components/portfolio/IncomeSourceCard.vue'
import ExpenseSourceCard from '../components/portfolio/ExpenseSourceCard.vue'
import InvestmentCard from '../components/portfolio/InvestmentCard.vue'
import LmpGroupCard from '../components/portfolio/LmpGroupCard.vue'
import RpGroupCard from '../components/portfolio/RpGroupCard.vue'
import PortfolioChart from '../components/portfolio/PortfolioChart.vue'
import BalanceChart from '../components/portfolio/BalanceChart.vue'
import TotalAssetChart from '../components/portfolio/TotalAssetChart.vue'
import AssetStackedBarChart from '../components/portfolio/AssetStackedBarChart.vue'
import PortfolioTable from '../components/portfolio/PortfolioTable.vue'

const MAX_GROUPS = 5

let nextId = 1
function uid() { return `g${nextId++}` }

type Tab = 'income' | 'expense' | 'invest' | 'lmp' | 'rp'
const activeTab = ref<Tab>('income')
const tabs: { key: Tab; label: string; color: string }[] = [
  { key: 'income', label: '收入', color: '#34d399' },
  { key: 'expense', label: '支出', color: '#fb923c' },
  { key: 'invest', label: '投資', color: '#60a5fa' },
  { key: 'lmp', label: 'LMP', color: '#f59e0b' },
  { key: 'rp', label: 'RP', color: '#a78bfa' },
]

const currentAge = ref(30)
const totalAssets = ref(500)
const inflation = ref(2)

const incomeSources = ref<IncomeSource[]>([{
  id: uid(), label: '勞保年金', annualAmount: 24, amountBasis: 'real',
  growthRate: 0, growthBasis: 'real', fromAge: 65, toAge: 85,
  isOneTime: false, occurAge: 65,
}])

const expenseSources = ref<ExpenseSource[]>([])

const investments = ref<Investment[]>([])

const lmpGroups = ref<LmpGroup[]>([{
  id: uid(), label: '基本生活費', rate: 1.5, rateBasis: 'real',
  annualWithdraw: 48, withdrawBasis: 'real', fromAge: 65, toAge: 85,
}])

const rpGroups = ref<RpGroup[]>([{
  id: uid(), label: '額外花費', rate: 6, rateBasis: 'real',
  annualWithdraw: 20, withdrawBasis: 'real', fromAge: 65, toAge: 85,
}])

const result = usePortfolioCalc(
  currentAge, totalAssets, inflation,
  incomeSources, expenseSources, investments, lmpGroups, rpGroups,
)

function addIncome() {
  if (incomeSources.value.length >= MAX_GROUPS) return
  incomeSources.value.push({
    id: uid(), label: '新收入', annualAmount: 0, amountBasis: 'real',
    growthRate: 0, growthBasis: 'real', fromAge: 65, toAge: 85,
    isOneTime: false, occurAge: 65,
  })
}
function addExpense() {
  if (expenseSources.value.length >= MAX_GROUPS) return
  expenseSources.value.push({
    id: uid(), label: '新支出', annualAmount: 0, amountBasis: 'real',
    growthRate: 0, growthBasis: 'real', fromAge: 65, toAge: 85,
    isOneTime: false, occurAge: 65,
  })
}
function addInvestment() {
  if (investments.value.length >= MAX_GROUPS) return
  investments.value.push({
    id: uid(), label: '新投資', rate: 6, rateBasis: 'real',
    initialValue: 0, monthlyContribution: 0, fromAge: currentAge.value, toAge: 65,
  })
}
function addLmp() {
  if (lmpGroups.value.length >= MAX_GROUPS) return
  lmpGroups.value.push({
    id: uid(), label: '新 LMP', rate: 1.5, rateBasis: 'real',
    annualWithdraw: 0, withdrawBasis: 'real', fromAge: 65, toAge: 85,
  })
}
function addRp() {
  if (rpGroups.value.length >= MAX_GROUPS) return
  rpGroups.value.push({
    id: uid(), label: '新 RP', rate: 6, rateBasis: 'real',
    annualWithdraw: 0, withdrawBasis: 'real', fromAge: 65, toAge: 85,
  })
}
function removeIncome(idx: number) { incomeSources.value.splice(idx, 1) }
function removeExpense(idx: number) { expenseSources.value.splice(idx, 1) }
function removeInvestment(idx: number) { investments.value.splice(idx, 1) }
function removeLmp(idx: number) { lmpGroups.value.splice(idx, 1) }
function removeRp(idx: number) { rpGroups.value.splice(idx, 1) }

function getInvestEnd(id: string): number {
  return result.value.investmentResults.find(r => r.id === id)?.endValue ?? 0
}
function getLmpReq(id: string): number {
  return result.value.lmpRequired.find(r => r.id === id)?.requiredValue ?? 0
}
function getRpReq(id: string): number {
  return result.value.rpRequired.find(r => r.id === id)?.requiredValue ?? 0
}
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-tag">Multi-Asset Portfolio Simulator</div>
      <h1 class="header-title">多資產組合模擬器</h1>
      <div class="header-sub">建立多組 LMP / RP + 多組收入來源，模擬退休後現金流</div>
    </div>

    <!-- Global Parameters -->
    <SliderGroup title="全域參數" color="#60a5fa">
      <div class="global-sliders">
        <SliderInput v-model="currentAge" label="目前年齡" :min="20" :max="80" :step="1" unit=" 歲" />
        <SliderInput v-model="totalAssets" label="現有資產總額" :min="0" :max="5000" :step="1" unit=" 萬" :format="fmtMoney" />
        <SliderInput v-model="inflation" label="預估通膨率" :min="0" :max="6" :step="0.1" unit="%" />
      </div>
    </SliderGroup>

    <!-- Tab bar -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        :style="activeTab === tab.key ? { color: tab.color, borderBottomColor: tab.color } : {}"
        @click="activeTab = tab.key">{{ tab.label }}</button>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      <!-- 收入 -->
      <div v-if="activeTab === 'income'" class="section">
        <div class="section-header">
          <span class="section-title" style="color: #34d399">收入</span>
          <button v-if="incomeSources.length < MAX_GROUPS" class="add-btn income" @click="addIncome">+ 新增收入</button>
        </div>
        <IncomeSourceCard
          v-for="(src, idx) in incomeSources"
          :key="src.id"
          v-model="incomeSources[idx]"
          @delete="removeIncome(idx)" />
        <div v-if="!incomeSources.length" class="empty-hint">尚無收入</div>
      </div>

      <!-- 支出 -->
      <div v-if="activeTab === 'expense'" class="section">
        <div class="section-header">
          <span class="section-title" style="color: #fb923c">支出</span>
          <button v-if="expenseSources.length < MAX_GROUPS" class="add-btn expense" @click="addExpense">+ 新增支出</button>
        </div>
        <ExpenseSourceCard
          v-for="(src, idx) in expenseSources"
          :key="src.id"
          v-model="expenseSources[idx]"
          @delete="removeExpense(idx)" />
        <div v-if="!expenseSources.length" class="empty-hint">尚無支出</div>
      </div>

      <!-- 投資 -->
      <div v-if="activeTab === 'invest'" class="section">
        <div class="section-header">
          <span class="section-title" style="color: #60a5fa">投資</span>
          <button v-if="investments.length < MAX_GROUPS" class="add-btn invest" @click="addInvestment">+ 新增投資</button>
        </div>
        <InvestmentCard
          v-for="(inv, idx) in investments"
          :key="inv.id"
          v-model="investments[idx]"
          :end-value="getInvestEnd(inv.id)"
          @delete="removeInvestment(idx)" />
        <div v-if="!investments.length" class="empty-hint">尚無投資</div>
      </div>

      <!-- LMP -->
      <div v-if="activeTab === 'lmp'" class="section">
        <div class="section-header">
          <span class="section-title" style="color: #f59e0b">LMP</span>
          <button v-if="lmpGroups.length < MAX_GROUPS" class="add-btn lmp" @click="addLmp">+ 新增 LMP</button>
        </div>
        <LmpGroupCard
          v-for="(g, idx) in lmpGroups"
          :key="g.id"
          v-model="lmpGroups[idx]"
          :required-value="getLmpReq(g.id)"
          @delete="removeLmp(idx)" />
        <div v-if="!lmpGroups.length" class="empty-hint">尚無 LMP</div>
      </div>

      <!-- RP -->
      <div v-if="activeTab === 'rp'" class="section">
        <div class="section-header">
          <span class="section-title" style="color: #a78bfa">RP</span>
          <button v-if="rpGroups.length < MAX_GROUPS" class="add-btn rp" @click="addRp">+ 新增 RP</button>
        </div>
        <RpGroupCard
          v-for="(g, idx) in rpGroups"
          :key="g.id"
          v-model="rpGroups[idx]"
          :required-value="getRpReq(g.id)"
          @delete="removeRp(idx)" />
        <div v-if="!rpGroups.length" class="empty-hint">尚無 RP</div>
      </div>
    </div>

    <!-- Charts -->
    <PortfolioChart :rows="result.rows" />
    <BalanceChart :rows="result.rows" />
    <TotalAssetChart :rows="result.rows" />
    <AssetStackedBarChart :rows="result.rows" />
    <PortfolioTable :rows="result.rows" />

    <!-- Footer -->
    <div class="footer">本工具僅供參考，不構成投資建議</div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(160deg, #0a0f1c 0%, #0f172a 40%, #111827 100%);
  color: #e8eaed;
  font-family: 'DM Sans', sans-serif;
  padding: 24px 20px;
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
  font-family: 'Space Mono', monospace;
}
.header-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #e8eaed, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.header-sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.global-sliders {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.global-sliders > * {
  flex: 1;
  min-width: 160px;
}

.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 0;
}
.tab-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
  margin-bottom: -1px;
}
.tab-btn:hover {
  color: #94a3b8;
}
.tab-btn.active {
  border-bottom-width: 2px;
  border-bottom-style: solid;
}
.tab-content {
  min-height: 120px;
}

.section {
  margin-bottom: 16px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: 'Space Mono', monospace;
}
.add-btn {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
}
.add-btn.income { color: #34d399; border-color: rgba(52, 211, 153, 0.3); }
.add-btn.income:hover { background: rgba(52, 211, 153, 0.1); border-color: rgba(52, 211, 153, 0.5); }
.add-btn.expense { color: #fb923c; border-color: rgba(251, 146, 60, 0.3); }
.add-btn.expense:hover { background: rgba(251, 146, 60, 0.1); border-color: rgba(251, 146, 60, 0.5); }
.add-btn.invest { color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); }
.add-btn.invest:hover { background: rgba(96, 165, 250, 0.1); border-color: rgba(96, 165, 250, 0.5); }
.add-btn.lmp { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
.add-btn.lmp:hover { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.5); }
.add-btn.rp { color: #a78bfa; border-color: rgba(167, 139, 250, 0.3); }
.add-btn.rp:hover { background: rgba(167, 139, 250, 0.1); border-color: rgba(167, 139, 250, 0.5); }

.empty-hint {
  text-align: center;
  padding: 20px;
  color: #4b5563;
  font-size: 12px;
  border: 1px dashed #1e293b;
  border-radius: 12px;
}

.summary-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 18px 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.summary-label {
  font-size: 10px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Space Mono', monospace;
}
.summary-value {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Space Mono', monospace;
}
.summary-value.lmp { color: #f59e0b; }
.summary-value.rp { color: #a78bfa; }
.summary-value.total { color: #e8eaed; }
.summary-value.funded { color: #60a5fa; }
.summary-value.surplus { color: #34d399; }
.summary-value.deficit { color: #f87171; }
.summary-sep {
  color: #4b5563;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Space Mono', monospace;
}
.summary-divider {
  width: 1px;
  height: 36px;
  background: #334155;
  margin: 0 8px;
}

.footer {
  text-align: center;
  margin-top: 28px;
  padding: 16px 0;
  border-top: 1px solid #1e293b;
  font-size: 11px;
  color: #4b5563;
}

@media (max-width: 640px) {
  .global-sliders {
    flex-direction: column;
    gap: 0;
  }
  .summary-banner {
    gap: 10px;
    padding: 14px 16px;
  }
  .summary-value {
    font-size: 14px;
  }
  .summary-divider {
    width: 100%;
    height: 1px;
    margin: 4px 0;
  }
}
</style>
