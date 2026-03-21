<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { IncomeSource, ExpenseSource, Investment, LmpGroup, RpGroup, GroupTab, PortfolioItem } from '../types/portfolio'
import { usePortfolioCalc } from '../composables/usePortfolioCalc'
import { usePortfolioRecordSlots } from '../composables/usePortfolioRecordSlots'
import { fmtMoney } from '../utils/format'
import { encodePortfolioState, decodePortfolioState, getPortfolioHashData } from '../utils/urlState'
import { PORTFOLIO_PRESETS, hydratePreset } from '../data/portfolioPresets'
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

const MAX_ITEMS_PER_TYPE = 100
const MAX_GROUP_TABS = 20

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

/* ── Restore from URL ── */
const _urlHashData = getPortfolioHashData()
const _urlState = _urlHashData ? decodePortfolioState(_urlHashData, uid) : null

/* ── Group Tabs ── */
const groupTabs = ref<GroupTab[]>([
  {
    id: uid(), label: '計畫A',
    items: [
      { type: 'income', data: { id: uid(), label: '薪資收入', annualAmount: 60, amountBasis: 'nominal', growthRate: 0, growthBasis: 'nominal', fromAge: 30, toAge: 64, isOneTime: false, occurAge: 30 } },
      { type: 'expense', data: { id: uid(), label: '基本生活費', annualAmount: 24, amountBasis: 'real', growthRate: 0, growthBasis: 'real', fromAge: 30, toAge: 80, isOneTime: false, occurAge: 30 } },
      { type: 'lmp', data: { id: uid(), label: '退休 LMP', rate: 1.5, rateBasis: 'real', annualWithdraw: 24, withdrawBasis: 'real', fromAge: 65, toAge: 80 } },
      { type: 'rp', data: { id: uid(), label: '退休 RP', rate: 6, rateBasis: 'real', annualWithdraw: 12, withdrawBasis: 'real', fromAge: 65, toAge: 80 } },
    ],
  }
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
const totalAssets = ref(100)
const inflation = ref(2)
const isNominal = ref(false)

/* ── Record Slots (captures defaultSnap from current refs before URL state is applied) ── */
const SLOT_LABELS = ['即時試算', '紀錄 1', '紀錄 2', '紀錄 3']
const { activeSlot, slotFilled, slotDirty, switchSlot, resetSlot, copyToSlot } = usePortfolioRecordSlots({
  currentAge, totalAssets, inflation, groupTabs, activeGroupIdx, syncNextId,
})

/* ── Apply URL state after defaultSnap is captured ── */
if (_urlState) {
  currentAge.value = _urlState.currentAge
  totalAssets.value = _urlState.totalAssets
  inflation.value = _urlState.inflation
  groupTabs.value = _urlState.groupTabs
}

const copiedSlot = ref<number | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null
function doCopy(target: number) {
  copyToSlot(target)
  copiedSlot.value = target
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { copiedSlot.value = null }, 1200)
}

/* ── Toggle item enabled state ── */
function toggleEnabled(item: PortfolioItem) {
  item.enabled = item.enabled !== false ? false : true
}

/* ── Flatten all groups for calculation ── */
function pickItems<T>(type: PortfolioItem['type']): T[] {
  return groupTabs.value.flatMap(g => g.items.filter(i => i.type === type && i.enabled !== false).map(i => i.data)) as T[]
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
    id: uid(), label: '新收入', annualAmount: 0, amountBasis: 'nominal',
    growthRate: 0, growthBasis: 'nominal', fromAge: 65, toAge: 85,
    isOneTime: false, occurAge: 65,
  } })
}
function addExpense(group: GroupTab) {
  if (countByType(group, 'expense') >= MAX_ITEMS_PER_TYPE) return
  group.items.push({ type: 'expense', data: {
    id: uid(), label: '新支出', annualAmount: 0, amountBasis: 'nominal',
    growthRate: 0, growthBasis: 'nominal', fromAge: 65, toAge: 85,
    isOneTime: false, occurAge: 65,
  } })
}
function addInvestment(group: GroupTab) {
  if (countByType(group, 'invest') >= MAX_ITEMS_PER_TYPE) return
  group.items.push({ type: 'invest', data: {
    id: uid(), label: '新投資', rate: 6, rateBasis: 'real',
    initialValue: 0, initialValueBasis: 'real',
    monthlyContribution: 0, monthlyContributionBasis: 'real',
    fromAge: currentAge.value, toAge: 65,
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

/* ── Load Preset ── */
const presetMenuOpen = ref(false)
function loadPreset(idx: number) {
  const state = hydratePreset(PORTFOLIO_PRESETS[idx], uid)
  currentAge.value = state.currentAge
  totalAssets.value = state.totalAssets
  inflation.value = state.inflation
  groupTabs.value = state.groupTabs
  activeGroupIdx.value = 0
  presetMenuOpen.value = false
}

/* ── Export / Import Portfolio ── */
const fileInputRef = ref<HTMLInputElement | null>(null)
const importMsg = ref<{ text: string; ok: boolean } | null>(null)
let importMsgTimer: ReturnType<typeof setTimeout> | null = null

function showImportMsg(text: string, ok: boolean) {
  importMsg.value = { text, ok }
  if (importMsgTimer) clearTimeout(importMsgTimer)
  importMsgTimer = setTimeout(() => { importMsg.value = null }, 2500)
}

function exportPortfolio() {
  const state = {
    _version: 1,
    currentAge: currentAge.value,
    totalAssets: totalAssets.value,
    inflation: inflation.value,
    groupTabs: groupTabs.value.map(g => ({
      label: g.label,
      items: g.items.map(item => {
        const { id: _, ...rest } = item.data as unknown as Record<string, unknown> & { id: string }
        const entry: Record<string, unknown> = { type: item.type, data: rest }
        if (item.enabled === false) entry.enabled = false
        return entry
      }),
    })),
  }
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `portfolio-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInputRef.value?.click()
}

function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result as string)
      if (
        typeof raw.currentAge !== 'number' ||
        typeof raw.totalAssets !== 'number' ||
        typeof raw.inflation !== 'number' ||
        !Array.isArray(raw.groupTabs)
      ) {
        showImportMsg('格式錯誤：缺少必要欄位', false)
        return
      }
      const hydrated = raw.groupTabs.map((g: { label: string; items: Array<{ type: string; data: Record<string, unknown>; enabled?: boolean }> }) => ({
        id: uid(),
        label: g.label,
        items: g.items.map((item: { type: string; data: Record<string, unknown>; enabled?: boolean }) => {
          const pi: Record<string, unknown> = { type: item.type, data: { ...item.data, id: uid() } }
          if (item.enabled === false) pi.enabled = false
          return pi
        }),
      })) as GroupTab[]

      currentAge.value = raw.currentAge
      totalAssets.value = raw.totalAssets
      inflation.value = raw.inflation
      groupTabs.value = hydrated
      activeGroupIdx.value = 0
      showImportMsg('匯入成功', true)
    } catch {
      showImportMsg('檔案解析失敗', false)
    }
  }
  reader.readAsText(file)
}

/* ── Share URL Modal ── */
const shareModalOpen = ref(false)
const shareUrl = ref('')
const shareCopied = ref(false)
let shareCopiedTimer: ReturnType<typeof setTimeout> | null = null

function openShareModal() {
  shareUrl.value = window.location.href
  shareCopied.value = false
  shareModalOpen.value = true
}
function closeShareModal() {
  shareModalOpen.value = false
}
async function copyShareUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    shareCopied.value = true
    if (shareCopiedTimer) clearTimeout(shareCopiedTimer)
    shareCopiedTimer = setTimeout(() => { shareCopied.value = false }, 2000)
  } catch {
    /* fallback for older browsers */
    const input = document.querySelector('.share-url-input') as HTMLInputElement | null
    if (input) { input.select(); document.execCommand('copy') }
  }
}

/* ── Sync state → URL hash (debounced, replaceState to avoid history spam) ── */
let _urlTimer: ReturnType<typeof setTimeout> | null = null
watch(
  [currentAge, totalAssets, inflation, groupTabs],
  () => {
    if (_urlTimer) clearTimeout(_urlTimer)
    _urlTimer = setTimeout(() => {
      const encoded = encodePortfolioState(
        currentAge.value, totalAssets.value, inflation.value, groupTabs.value,
      )
      history.replaceState(null, '', `#portfolio/${encoded}`)
    }, 500)
  },
  { deep: true },
)
onUnmounted(() => { if (_urlTimer) clearTimeout(_urlTimer) })
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-tag">Multi-Asset Portfolio Simulator</div>
      <h1 class="header-title">多資產組合模擬器</h1>
      <div class="header-sub">建立多組 LMP / RP + 多組收入來源，模擬退休後現金流</div>
    </div>

    <!-- Preset Loader + Import/Export -->
    <div class="preset-bar">
      <div class="preset-actions">
        <button class="preset-toggle" @click="presetMenuOpen = !presetMenuOpen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
            <polyline points="7.5 19.79 7.5 14.6 3 12" />
            <polyline points="21 12 16.5 14.6 16.5 19.79" />
            <line x1="12" y1="22" x2="12" y2="17" />
            <line x1="12" y1="13" x2="12" y2="7" />
          </svg>
          載入範例組合
          <svg class="chevron" :class="{ open: presetMenuOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <span class="preset-divider" />

        <button class="io-btn" @click="triggerImport" title="匯入組合 (.json)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          匯入
        </button>
        <input ref="fileInputRef" type="file" accept=".json" class="hidden-input" @change="onImportFile" />

        <button class="io-btn" @click="exportPortfolio" title="匯出目前組合">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          匯出
        </button>

        <button class="io-btn" @click="openShareModal" title="複製網址分享">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          複製網址
        </button>
      </div>

      <Transition name="import-msg">
        <div v-if="importMsg" class="import-msg" :class="importMsg.ok ? 'ok' : 'err'">
          <svg v-if="importMsg.ok" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          {{ importMsg.text }}
        </div>
      </Transition>

      <Transition name="preset-dropdown">
        <div v-if="presetMenuOpen" class="preset-menu">
          <button
            v-for="(preset, idx) in PORTFOLIO_PRESETS"
            :key="idx"
            class="preset-item"
            @click="loadPreset(idx)">
            <span class="preset-item-label">{{ preset.label }}</span>
            <span class="preset-item-desc">{{ preset.description }}</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Record Slot Bar -->
    <div class="record-bar">
      <button
        v-for="(label, idx) in SLOT_LABELS"
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

    <!-- Copy Slot Row -->
    <div class="copy-bar">
      <span class="copy-label">複製到</span>
      <button
        v-for="(label, idx) in SLOT_LABELS"
        :key="idx"
        class="copy-target-btn"
        :class="{ disabled: idx === activeSlot, copied: copiedSlot === idx }"
        :disabled="idx === activeSlot"
        @click="doCopy(idx)">
        <template v-if="copiedSlot === idx">
          <svg width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
          已複製
        </template>
        <template v-else>{{ label }}</template>
      </button>
    </div>

    <!-- Global Parameters -->
    <SliderGroup title="個人基本設定" color="#60a5fa">
      <div class="global-sliders">
        <SliderInput v-model="currentAge" label="目前年齡" :min="20" :max="80" :step="1" unit=" 歲(年初)" />
        <SliderInput v-model="totalAssets" label="現有資產總額" :min="0" :max="2000" :step="1" unit=" 萬" :format="fmtMoney" />
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
              :enabled="item.enabled !== false"
              @toggle-enabled="toggleEnabled(item)"
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
              :enabled="item.enabled !== false"
              @toggle-enabled="toggleEnabled(item)"
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
              :inflation="inflation" :current-age="currentAge"
              :tag="TYPE_META[item.type].label" :tag-color="TYPE_META[item.type].color"
              :enabled="item.enabled !== false"
              @toggle-enabled="toggleEnabled(item)"
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
              :inflation="inflation" :current-age="currentAge"
              :tag="TYPE_META[item.type].label" :tag-color="TYPE_META[item.type].color"
              :enabled="item.enabled !== false"
              @toggle-enabled="toggleEnabled(item)"
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
              :inflation="inflation" :current-age="currentAge"
              :tag="TYPE_META[item.type].label" :tag-color="TYPE_META[item.type].color"
              :enabled="item.enabled !== false"
              @toggle-enabled="toggleEnabled(item)"
              @delete="removeItem(activeGroup, idx)">
              <div class="reorder-row reorder-mobile">
                <button class="reorder-btn" :disabled="idx === 0" @click="moveItem(activeGroup, idx, -1)" title="上移">&#9650; 上移</button>
                <button class="reorder-btn" :disabled="idx === activeGroup.items.length - 1" @click="moveItem(activeGroup, idx, 1)" title="下移">&#9660; 下移</button>
              </div>
            </RpGroupCard>
          </div>
        </div>
      </div>

      <div v-if="!activeGroup.items.length" class="empty-hint">
        尚無項目，請從下方新增，或
        <button class="empty-hint-link" @click="presetMenuOpen = true">載入範例組合</button>
      </div>

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
    <PortfolioChart :rows="result.rows" :inflation="inflation" :current-age="currentAge" v-model:is-nominal="isNominal" />
    <BalanceChart :rows="result.rows" :inflation="inflation" :current-age="currentAge" v-model:is-nominal="isNominal" />
    <TotalAssetChart :rows="result.rows" :inflation="inflation" :current-age="currentAge" v-model:is-nominal="isNominal" />
    <AssetStackedBarChart :rows="result.rows" :inflation="inflation" :current-age="currentAge" v-model:is-nominal="isNominal" />
    <PortfolioTable :rows="result.rows" :inflation="inflation" :current-age="currentAge" v-model:is-nominal="isNominal" />

    <!-- Footer -->
    <div class="footer">本工具僅供參考，不構成投資建議</div>

    <!-- Share URL Modal -->
    <Transition name="share-modal">
      <div v-if="shareModalOpen" class="share-overlay" @click.self="closeShareModal">
        <div class="share-dialog">
            <div class="share-dialog-header">
              <span class="share-dialog-title">分享網址 (即時試算資料)</span>
              <button class="share-close-btn" @click="closeShareModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div class="share-url-row">
              <input class="share-url-input" :value="shareUrl" readonly @focus="($event.target as HTMLInputElement).select()" />
              <button class="share-copy-btn" :class="{ copied: shareCopied }" @click="copyShareUrl">
                <svg v-if="!shareCopied" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                {{ shareCopied ? '已複製' : '複製' }}
              </button>
            </div>
            <div class="share-hint">網址可能很長，建議使用短網址服務：</div>
            <div class="share-shortener-links">
              <a href="https://reurl.cc/" target="_blank" rel="noopener noreferrer">縮短網址產生器 — reurl</a>
              <a href="https://ppt.cc/" target="_blank" rel="noopener noreferrer">來個 PPT 短網址</a>
            </div>
        </div>
      </div>
    </Transition>
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

/* ── Preset Bar ── */
.preset-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  position: relative;
}
.preset-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.preset-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: 1px solid rgba(96, 165, 250, 0.25);
  border-radius: 8px;
  background: rgba(96, 165, 250, 0.06);
  color: #60a5fa;
  font-size: 13px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.preset-toggle:hover {
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(96, 165, 250, 0.5);
}
.preset-divider {
  width: 1px;
  height: 20px;
  background: #334155;
  flex-shrink: 0;
}
.io-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.io-btn:hover {
  background: rgba(148, 163, 184, 0.1);
  border-color: rgba(148, 163, 184, 0.4);
  color: #e2e8f0;
}
.hidden-input {
  display: none;
}
.import-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}
.import-msg.ok {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.3);
}
.import-msg.err {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
}
.import-msg-enter-active,
.import-msg-leave-active {
  transition: all 0.25s ease;
}
.import-msg-enter-from,
.import-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.chevron {
  transition: transform 0.25s;
}
.chevron.open {
  transform: rotate(180deg);
}
.preset-menu {
  width: 100%;
  max-width: 420px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.preset-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}
.preset-item:hover {
  background: rgba(96, 165, 250, 0.08);
  border-color: rgba(96, 165, 250, 0.2);
}
.preset-item-label {
  font-size: 13px;
  font-weight: 600;
  color: #e8eaed;
  font-family: 'DM Sans', sans-serif;
}
.preset-item-desc {
  font-size: 11px;
  color: #6b7280;
  font-family: 'DM Sans', sans-serif;
  line-height: 1.4;
}
.preset-dropdown-enter-active,
.preset-dropdown-leave-active {
  transition: all 0.2s ease;
}
.preset-dropdown-enter-from,
.preset-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
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
.empty-hint-link {
  background: none;
  border: none;
  color: #60a5fa;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0;
  transition: color 0.2s;
}
.empty-hint-link:hover {
  color: #93bbfd;
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

/* ── Copy Bar ── */
.copy-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -10px;
  margin-bottom: 16px;
  padding: 4px 6px;
}
.copy-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}
.copy-target-btn {
  flex: 1;
  padding: 4px 0;
  border: 1px solid rgba(96, 165, 250, 0.25);
  border-radius: 6px;
  background: transparent;
  color: #60a5fa;
  font-size: 11px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.copy-target-btn:hover:not(:disabled) {
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(96, 165, 250, 0.5);
}
.copy-target-btn:disabled {
  color: #374151;
  border-color: rgba(55, 65, 81, 0.3);
  cursor: default;
}
.copy-target-btn.copied {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.5);
  background: rgba(52, 211, 153, 0.12);
  animation: copy-flash 0.3s ease-out;
}
@keyframes copy-flash {
  0% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

.footer {
  text-align: center;
  margin-top: 28px;
  padding: 16px 0;
  border-top: 1px solid #1e293b;
  font-size: 11px;
  color: #4b5563;
}

/* ── Share Modal ── */
.share-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}
.share-dialog {
  width: 90%;
  max-width: 520px;
  padding: 24px;
  border-radius: 14px;
  background: #1e293b;
  border: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
.share-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.share-dialog-title {
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
  font-family: 'DM Sans', sans-serif;
}
.share-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}
.share-close-btn:hover {
  background: rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
}
.share-url-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.share-url-input {
  flex: 1;
  min-width: 0;
  padding: 9px 12px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  color: #cbd5e1;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  outline: none;
  transition: border-color 0.2s;
}
.share-url-input:focus {
  border-color: rgba(96, 165, 250, 0.5);
}
.share-copy-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px 16px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  background: rgba(96, 165, 250, 0.1);
  color: #60a5fa;
  font-size: 13px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.share-copy-btn:hover {
  background: rgba(96, 165, 250, 0.2);
  border-color: rgba(96, 165, 250, 0.5);
}
.share-copy-btn.copied {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.3);
  background: rgba(52, 211, 153, 0.1);
}
.share-hint {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
  font-family: 'DM Sans', sans-serif;
}
.share-shortener-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.share-shortener-links a {
  font-size: 13px;
  font-weight: 600;
  color: #60a5fa;
  text-decoration: none;
  padding: 5px 12px;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 6px;
  background: rgba(96, 165, 250, 0.05);
  transition: all 0.2s;
  font-family: 'DM Sans', sans-serif;
}
.share-shortener-links a:hover {
  background: rgba(96, 165, 250, 0.15);
  border-color: rgba(96, 165, 250, 0.4);
}
.share-modal-enter-active,
.share-modal-leave-active {
  transition: opacity 0.2s ease;
}
.share-modal-enter-active .share-dialog,
.share-modal-leave-active .share-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.share-modal-enter-from,
.share-modal-leave-to {
  opacity: 0;
}
.share-modal-enter-from .share-dialog {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
.share-modal-leave-to .share-dialog {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}

@media (max-width: 640px) {
  .preset-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  .preset-divider {
    display: none;
  }
  .io-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
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
