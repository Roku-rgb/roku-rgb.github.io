<script setup lang="ts">
import { ref, computed } from 'vue'
import type { IncomeSource, ExpenseSource, Investment, LmpGroup, RpGroup, GroupTab, PortfolioItem } from '../types/portfolio'
import { usePortfolioCalc } from '../composables/usePortfolioCalc'
import { usePortfolioRecordSlots } from '../composables/usePortfolioRecordSlots'
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

const MAX_ITEMS_PER_TYPE = 5
const MAX_GROUP_TABS = 10

let nextId = 1
function uid() { return `g${nextId++}` }

/** After restoring a snapshot, bump nextId past all existing IDs to avoid collisions */
function syncNextId(snap: { groupTabs: GroupTab[] }) {
  let max = 0
  for (const tab of snap.groupTabs) {
    const n = parseInt(tab.id.slice(1))
    if (n > max) max = n
    for (const item of tab.items) {
      const m = parseInt(item.data.id.slice(1))
      if (m > max) max = m
    }
  }
  if (max >= nextId) nextId = max + 1
}

/* ── Group Tabs ── */
const groupTabs = ref<GroupTab[]>([
  {
    id: uid(), label: '薪水',
    items: [
      { type: 'income', data: { id: uid(), label: '薪資收入', annualAmount: 100, amountBasis: 'real', growthRate: 2, growthBasis: 'real', fromAge: 30, toAge: 64, isOneTime: false, occurAge: 30 } },
    ],
  },
  { id: uid(), label: '40+', items: [] },
  { id: uid(), label: '50+', items: [] },
  {
    id: uid(), label: '65+',
    items: [
      { type: 'income', data: { id: uid(), label: '勞保年金', annualAmount: 24, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 65, toAge: 85, isOneTime: false, occurAge: 65 } },
      { type: 'lmp', data: { id: uid(), label: '基本生活費', rate: 1.5, rateBasis: 'real', annualWithdraw: 48, withdrawBasis: 'real', fromAge: 65, toAge: 85 } },
      { type: 'rp', data: { id: uid(), label: '額外花費', rate: 6, rateBasis: 'real', annualWithdraw: 20, withdrawBasis: 'real', fromAge: 65, toAge: 85 } },
    ],
  },
])

const activeGroupIdx = ref(0)
const activeGroup = computed(() => groupTabs.value[activeGroupIdx.value])

/* ── Editing group name ── */
const editingGroupIdx = ref<number | null>(null)
const editingGroupName = ref('')

function startEditGroupName(idx: number) {
  editingGroupIdx.value = idx
  editingGroupName.value = groupTabs.value[idx].label
}
function finishEditGroupName() {
  if (editingGroupIdx.value !== null && editingGroupName.value.trim()) {
    groupTabs.value[editingGroupIdx.value].label = editingGroupName.value.trim()
  }
  editingGroupIdx.value = null
}

/* ── Add / Remove / Reorder group tabs ── */
function addGroupTab() {
  if (groupTabs.value.length >= MAX_GROUP_TABS) return
  groupTabs.value.push({ id: uid(), label: '新群組', items: [] })
  activeGroupIdx.value = groupTabs.value.length - 1
}
function removeGroupTab(idx: number) {
  if (groupTabs.value.length <= 1) return
  groupTabs.value.splice(idx, 1)
  if (activeGroupIdx.value >= groupTabs.value.length) {
    activeGroupIdx.value = groupTabs.value.length - 1
  }
}
function moveGroupTab(idx: number, dir: -1 | 1) {
  const target = idx + dir
  if (target < 0 || target >= groupTabs.value.length) return
  const tabs = groupTabs.value
  const tmp = tabs[idx]
  tabs[idx] = tabs[target]
  tabs[target] = tmp
  activeGroupIdx.value = target
}

/* ── Drag reorder tabs ── */
const dragIdx = ref<number | null>(null)
function onTabDragStart(idx: number, e: DragEvent) {
  dragIdx.value = idx
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }
}
function onTabDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}
function onTabDrop(targetIdx: number) {
  if (dragIdx.value === null || dragIdx.value === targetIdx) { dragIdx.value = null; return }
  const tabs = groupTabs.value
  const [moved] = tabs.splice(dragIdx.value, 1)
  tabs.splice(targetIdx, 0, moved)
  activeGroupIdx.value = targetIdx
  dragIdx.value = null
}
function onTabDragEnd() {
  dragIdx.value = null
}

/* ── Global Parameters ── */
const currentAge = ref(30)
const totalAssets = ref(500)
const inflation = ref(2)

/* ── Record Slots ── */
const { activeSlot, slotFilled, slotDirty, switchSlot, resetSlot } = usePortfolioRecordSlots({
  currentAge, totalAssets, inflation, groupTabs, activeGroupIdx, syncNextId,
})

/* ── Flatten all groups for calculation ── */
function pickItems<T>(type: PortfolioItem['type']): T[] {
  return groupTabs.value.flatMap(g => g.items.filter(i => i.type === type).map(i => i.data)) as T[]
}
const allIncomeSources = computed(() => pickItems<IncomeSource>('income'))
const allExpenseSources = computed(() => pickItems<ExpenseSource>('expense'))
const allInvestments = computed(() => pickItems<Investment>('invest'))
const allLmpGroups = computed(() => pickItems<LmpGroup>('lmp'))
const allRpGroups = computed(() => pickItems<RpGroup>('rp'))

const result = usePortfolioCalc(
  currentAge, totalAssets, inflation,
  allIncomeSources, allExpenseSources, allInvestments, allLmpGroups, allRpGroups,
)

/* ── Count items by type in a group ── */
function countByType(group: GroupTab, type: PortfolioItem['type']): number {
  return group.items.filter(i => i.type === type).length
}

/* ── Add items ── */
function addIncome(group: GroupTab) {
  if (countByType(group, 'income') >= MAX_ITEMS_PER_TYPE) return
  group.items.push({ type: 'income', data: {
    id: uid(), label: '新收入', annualAmount: 0, amountBasis: 'real',
    growthRate: 0, growthBasis: 'real', fromAge: 65, toAge: 85,
    isOneTime: false, occurAge: 65,
  } })
}
function addExpense(group: GroupTab) {
  if (countByType(group, 'expense') >= MAX_ITEMS_PER_TYPE) return
  group.items.push({ type: 'expense', data: {
    id: uid(), label: '新支出', annualAmount: 0, amountBasis: 'real',
    growthRate: 0, growthBasis: 'real', fromAge: 65, toAge: 85,
    isOneTime: false, occurAge: 65,
  } })
}
function addInvestment(group: GroupTab) {
  if (countByType(group, 'invest') >= MAX_ITEMS_PER_TYPE) return
  group.items.push({ type: 'invest', data: {
    id: uid(), label: '新投資', rate: 6, rateBasis: 'real',
    initialValue: 0, monthlyContribution: 0, fromAge: currentAge.value, toAge: 65,
  } })
}
function addLmp(group: GroupTab) {
  if (countByType(group, 'lmp') >= MAX_ITEMS_PER_TYPE) return
  group.items.push({ type: 'lmp', data: {
    id: uid(), label: '新 LMP', rate: 1.5, rateBasis: 'real',
    annualWithdraw: 0, withdrawBasis: 'real', fromAge: 65, toAge: 85,
  } })
}
function addRp(group: GroupTab) {
  if (countByType(group, 'rp') >= MAX_ITEMS_PER_TYPE) return
  group.items.push({ type: 'rp', data: {
    id: uid(), label: '新 RP', rate: 6, rateBasis: 'real',
    annualWithdraw: 0, withdrawBasis: 'real', fromAge: 65, toAge: 85,
  } })
}

/* ── Remove / Reorder items ── */
function removeItem(group: GroupTab, idx: number) {
  group.items.splice(idx, 1)
}
function moveItem(group: GroupTab, idx: number, dir: -1 | 1) {
  const target = idx + dir
  if (target < 0 || target >= group.items.length) return
  const tmp = group.items[idx]
  group.items[idx] = group.items[target]
  group.items[target] = tmp
}

/* ── Computed helpers ── */
function getInvestEnd(id: string): number {
  return result.value.investmentResults.find(r => r.id === id)?.endValue ?? 0
}
function getLmpReq(id: string): number {
  return result.value.lmpRequired.find(r => r.id === id)?.requiredValue ?? 0
}
function getRpReq(id: string): number {
  return result.value.rpRequired.find(r => r.id === id)?.requiredValue ?? 0
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  income:  { label: '收入', color: '#34d399' },
  expense: { label: '支出', color: '#fb923c' },
  invest:  { label: '投資', color: '#60a5fa' },
  lmp:     { label: 'LMP',  color: '#f59e0b' },
  rp:      { label: 'RP',   color: '#a78bfa' },
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

    <!-- Record Slot Bar -->
    <div class="record-bar">
      <button
        v-for="(label, idx) in ['即時試算', '紀錄 1', '紀錄 2', '紀錄 3']"
        :key="idx"
        class="record-btn"
        :class="{
          active: activeSlot === idx,
          filled: idx >= 1 && slotFilled[idx],
        }"
        @click="switchSlot(idx)">
        {{ label }}
        <svg
          v-if="idx >= 1 && activeSlot === idx"
          class="save-icon"
          :class="slotDirty ? 'dirty' : 'saved'"
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <path v-if="!slotDirty" d="M5 12l5 5L20 7" />
          <circle v-else cx="5" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle v-if="slotDirty" cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle v-if="slotDirty" cx="19" cy="12" r="2" fill="currentColor" stroke="none" />
        </svg>
        <svg
          v-if="idx >= 1 && activeSlot !== idx && slotFilled[idx]"
          class="save-icon saved"
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </button>
      <button class="reset-btn" @click="resetSlot()">
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 1 3 6.75" />
          <polyline points="3 7 3 13 9 13" />
        </svg>
        <span class="reset-tip">重設</span>
      </button>
    </div>

    <!-- Global Parameters -->
    <SliderGroup title="個人基本設定" color="#60a5fa">
      <div class="global-sliders">
        <SliderInput v-model="currentAge" label="目前年齡" :min="20" :max="80" :step="1" unit=" 歲" />
        <SliderInput v-model="totalAssets" label="現有資產總額" :min="0" :max="5000" :step="1" unit=" 萬" :format="fmtMoney" />
        <SliderInput v-model="inflation" label="預估通膨率" :min="0" :max="6" :step="0.1" unit="%" />
      </div>
    </SliderGroup>

    <!-- Group Tab Bar -->
    <div class="group-tab-bar">
      <div class="group-tabs-scroll">
        <div
          v-for="(group, idx) in groupTabs"
          :key="group.id"
          class="group-tab-btn"
          :class="{ active: activeGroupIdx === idx, dragging: dragIdx === idx }"
          draggable="true"
          @click="activeGroupIdx = idx"
          @dragstart="onTabDragStart(idx, $event)"
          @dragover="onTabDragOver"
          @drop="onTabDrop(idx)"
          @dragend="onTabDragEnd">
          <span class="group-tab-label">{{ group.label }}</span>
          <span v-if="group.items.length" class="group-tab-count">{{ group.items.length }}</span>
        </div>
        <button
          v-if="groupTabs.length < MAX_GROUP_TABS"
          class="group-tab-btn add-group-btn"
          @click="addGroupTab"
          title="新增群組">+</button>
      </div>
    </div>

    <!-- Active Group Content -->
    <div v-if="activeGroup" class="group-content">
      <!-- Group header -->
      <div class="group-header">
        <div class="group-header-left">
          <template v-if="editingGroupIdx === activeGroupIdx">
            <input
              v-model="editingGroupName"
              class="group-title-input"
              @keyup.enter="finishEditGroupName"
              autofocus />
            <button class="group-action-btn save-btn" @click="finishEditGroupName" title="儲存">&#10003;</button>
          </template>
          <template v-else>
            <h2 class="group-title">{{ activeGroup.label }}</h2>
            <button class="group-action-btn rename-btn" @click="startEditGroupName(activeGroupIdx)" title="重新命名">&#9998;</button>
            <button class="group-action-btn move-btn move-btn-left" :disabled="activeGroupIdx === 0" @click="moveGroupTab(activeGroupIdx, -1)" title="左移">&#9664;</button>
            <button class="group-action-btn move-btn" :disabled="activeGroupIdx === groupTabs.length - 1" @click="moveGroupTab(activeGroupIdx, 1)" title="右移">&#9654;</button>
          </template>
        </div>
        <div class="group-header-right">
          <button
            v-if="groupTabs.length > 1"
            class="delete-group-btn"
            @click="removeGroupTab(activeGroupIdx)"
            title="刪除此群組">刪除群組</button>
        </div>
      </div>

      <!-- Unified item list with reorder -->
      <div class="items-list">
        <div v-for="(item, idx) in activeGroup.items" :key="item.data.id" class="item-row">
          <!-- Reorder buttons (desktop: left side) -->
          <div class="reorder-col reorder-desktop">
            <button class="reorder-btn" :disabled="idx === 0" @click="moveItem(activeGroup, idx, -1)" title="上移">&#9650;</button>
            <button class="reorder-btn" :disabled="idx === activeGroup.items.length - 1" @click="moveItem(activeGroup, idx, 1)" title="下移">&#9660;</button>
          </div>
          <!-- Card -->
          <div class="item-card-wrap">
            <IncomeSourceCard
              v-if="item.type === 'income'"
              v-model="(item as { type: 'income'; data: IncomeSource }).data"
              :tag="TYPE_META[item.type].label" :tag-color="TYPE_META[item.type].color"
              @delete="removeItem(activeGroup, idx)">
              <div class="reorder-row reorder-mobile">
                <button class="reorder-btn" :disabled="idx === 0" @click="moveItem(activeGroup, idx, -1)" title="上移">&#9650; 上移</button>
                <button class="reorder-btn" :disabled="idx === activeGroup.items.length - 1" @click="moveItem(activeGroup, idx, 1)" title="下移">&#9660; 下移</button>
              </div>
            </IncomeSourceCard>
            <ExpenseSourceCard
              v-if="item.type === 'expense'"
              v-model="(item as { type: 'expense'; data: ExpenseSource }).data"
              :tag="TYPE_META[item.type].label" :tag-color="TYPE_META[item.type].color"
              @delete="removeItem(activeGroup, idx)">
              <div class="reorder-row reorder-mobile">
                <button class="reorder-btn" :disabled="idx === 0" @click="moveItem(activeGroup, idx, -1)" title="上移">&#9650; 上移</button>
                <button class="reorder-btn" :disabled="idx === activeGroup.items.length - 1" @click="moveItem(activeGroup, idx, 1)" title="下移">&#9660; 下移</button>
              </div>
            </ExpenseSourceCard>
            <InvestmentCard
              v-if="item.type === 'invest'"
              v-model="(item as { type: 'invest'; data: Investment }).data"
              :end-value="getInvestEnd(item.data.id)"
              :tag="TYPE_META[item.type].label" :tag-color="TYPE_META[item.type].color"
              @delete="removeItem(activeGroup, idx)">
              <div class="reorder-row reorder-mobile">
                <button class="reorder-btn" :disabled="idx === 0" @click="moveItem(activeGroup, idx, -1)" title="上移">&#9650; 上移</button>
                <button class="reorder-btn" :disabled="idx === activeGroup.items.length - 1" @click="moveItem(activeGroup, idx, 1)" title="下移">&#9660; 下移</button>
              </div>
            </InvestmentCard>
            <LmpGroupCard
              v-if="item.type === 'lmp'"
              v-model="(item as { type: 'lmp'; data: LmpGroup }).data"
              :required-value="getLmpReq(item.data.id)"
              :tag="TYPE_META[item.type].label" :tag-color="TYPE_META[item.type].color"
              @delete="removeItem(activeGroup, idx)">
              <div class="reorder-row reorder-mobile">
                <button class="reorder-btn" :disabled="idx === 0" @click="moveItem(activeGroup, idx, -1)" title="上移">&#9650; 上移</button>
                <button class="reorder-btn" :disabled="idx === activeGroup.items.length - 1" @click="moveItem(activeGroup, idx, 1)" title="下移">&#9660; 下移</button>
              </div>
            </LmpGroupCard>
            <RpGroupCard
              v-if="item.type === 'rp'"
              v-model="(item as { type: 'rp'; data: RpGroup }).data"
              :required-value="getRpReq(item.data.id)"
              :tag="TYPE_META[item.type].label" :tag-color="TYPE_META[item.type].color"
              @delete="removeItem(activeGroup, idx)">
              <div class="reorder-row reorder-mobile">
                <button class="reorder-btn" :disabled="idx === 0" @click="moveItem(activeGroup, idx, -1)" title="上移">&#9650; 上移</button>
                <button class="reorder-btn" :disabled="idx === activeGroup.items.length - 1" @click="moveItem(activeGroup, idx, 1)" title="下移">&#9660; 下移</button>
              </div>
            </RpGroupCard>
          </div>
        </div>
      </div>

      <div v-if="!activeGroup.items.length" class="empty-hint">尚無項目，請從下方新增</div>

      <!-- Add buttons row -->
      <div class="add-buttons-row">
        <button v-if="countByType(activeGroup, 'income') < MAX_ITEMS_PER_TYPE" class="add-btn income" @click="addIncome(activeGroup)">+ 新增收入</button>
        <button v-if="countByType(activeGroup, 'expense') < MAX_ITEMS_PER_TYPE" class="add-btn expense" @click="addExpense(activeGroup)">+ 新增支出</button>
        <button v-if="countByType(activeGroup, 'invest') < MAX_ITEMS_PER_TYPE" class="add-btn invest" @click="addInvestment(activeGroup)">+ 新增投資</button>
        <button v-if="countByType(activeGroup, 'lmp') < MAX_ITEMS_PER_TYPE" class="add-btn lmp" @click="addLmp(activeGroup)">+ 新增 LMP</button>
        <button v-if="countByType(activeGroup, 'rp') < MAX_ITEMS_PER_TYPE" class="add-btn rp" @click="addRp(activeGroup)">+ 新增 RP</button>
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

/* ── Group Tab Bar ── */
.group-tab-bar {
  margin-bottom: 16px;
  border-bottom: 1px solid #1e293b;
}
.group-tabs-scroll {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  padding-bottom: 0;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}
.group-tabs-scroll::-webkit-scrollbar {
  height: 3px;
}
.group-tabs-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.group-tabs-scroll::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}
.group-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #6b7280;
  cursor: grab;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
  margin-bottom: -1px;
  white-space: nowrap;
  flex-shrink: 0;
  user-select: none;
}
.group-tab-btn.dragging {
  opacity: 0.4;
}
.group-tab-btn:hover {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.02);
}
.group-tab-btn.active {
  color: #e8eaed;
  border-bottom-color: #60a5fa;
}
.group-tab-label {
  pointer-events: none;
}
.group-tab-count {
  font-size: 10px;
  font-weight: 700;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 6px;
  border-radius: 8px;
  font-family: 'Space Mono', monospace;
  pointer-events: none;
}
.group-tab-btn.active .group-tab-count {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
}
.add-group-btn {
  color: #4b5563;
  font-size: 16px;
  padding: 10px 14px;
  font-weight: 400;
}
.add-group-btn:hover {
  color: #60a5fa;
}

/* ── Group Content ── */
.group-content {
  min-height: 120px;
}
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.group-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.group-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.group-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #e8eaed;
}
.group-action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #334155;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}
.group-action-btn:hover:not(:disabled) {
  background: rgba(96, 165, 250, 0.1);
  border-color: #60a5fa;
  color: #60a5fa;
}
.group-action-btn:disabled {
  opacity: 0.25;
  cursor: default;
}
.rename-btn {
  font-size: 14px;
}
.move-btn-left {
  margin-left: 8px;
}
.save-btn {
  font-size: 14px;
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.3);
}
.save-btn:hover {
  background: rgba(52, 211, 153, 0.1);
  border-color: rgba(52, 211, 153, 0.5);
  color: #34d399;
}
.group-title-input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #60a5fa;
  border-radius: 6px;
  color: #e8eaed;
  font-size: 18px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  padding: 2px 10px;
  width: 200px;
  outline: none;
}
.delete-group-btn {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 6px;
  background: transparent;
  color: #f87171;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
}
.delete-group-btn:hover {
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.5);
}

/* ── Item list with reorder ── */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.reorder-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 12px;
  flex-shrink: 0;
}
.reorder-btn {
  width: 30px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #334155;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
  color: #6b7280;
  font-size: 9px;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
  -webkit-tap-highlight-color: transparent;
}
.reorder-btn:hover:not(:disabled) {
  background: rgba(96, 165, 250, 0.1);
  border-color: #60a5fa;
  color: #60a5fa;
}
.reorder-btn:disabled {
  opacity: 0.25;
  cursor: default;
}
.item-card-wrap {
  flex: 1;
  min-width: 0;
}
.reorder-mobile {
  display: none;
}
.reorder-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 8px 0 4px;
}
.reorder-row .reorder-btn {
  width: auto;
  height: auto;
  padding: 4px 14px;
  font-size: 11px;
  gap: 4px;
}

/* ── Add Buttons ── */
.add-buttons-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
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
  padding: 12px;
  color: #4b5563;
  font-size: 11px;
  border: 1px dashed #1e293b;
  border-radius: 8px;
  margin-bottom: 16px;
}

/* ── Record Bar ── */
.record-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 6px;
  background: #1e293b;
  border-radius: 10px;
}
.record-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.record-btn:hover {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.04);
}
.record-btn.active {
  background: #334155;
  color: #e8eaed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
.reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 10px;
  flex-shrink: 0;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  cursor: pointer;
  transition: all 0.2s;
}
.reset-btn:hover {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
}
.reset-tip {
  font-size: 11px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}
.save-icon {
  margin-left: 4px;
  vertical-align: middle;
  transition: color 0.3s;
}
.save-icon.saved {
  color: #34d399;
}
.save-icon.dirty {
  color: #fbbf24;
  animation: pulse-dirty 1.2s ease-in-out infinite;
}
@keyframes pulse-dirty {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
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
  .group-tab-btn {
    padding: 8px 14px;
    font-size: 12px;
  }
  .reorder-desktop {
    display: none;
  }
  .reorder-mobile {
    display: flex;
  }
  .add-btn {
    padding: 8px 14px;
    font-size: 12px;
  }
}
</style>
