import { ref, watch, onUnmounted, type Ref } from 'vue'
import type { GroupTab } from '../types/portfolio'

const STORAGE_PREFIX = 'portfolio_record_'

function storageKey(slot: number) {
  return `${STORAGE_PREFIX}${slot}`
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch { /* storage full or unavailable */ }
}

function deleteStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch { /* ignore */ }
}

interface PortfolioState {
  currentAge: number
  totalAssets: number
  inflation: number
  groupTabs: GroupTab[]
  activeGroupIdx: number
}

interface PortfolioInputs {
  currentAge: Ref<number>
  totalAssets: Ref<number>
  inflation: Ref<number>
  groupTabs: Ref<GroupTab[]>
  activeGroupIdx: Ref<number>
  syncNextId: (state: PortfolioState) => void
}

function snapshot(inputs: PortfolioInputs): PortfolioState {
  return {
    currentAge: inputs.currentAge.value,
    totalAssets: inputs.totalAssets.value,
    inflation: inputs.inflation.value,
    groupTabs: JSON.parse(JSON.stringify(inputs.groupTabs.value)),
    activeGroupIdx: inputs.activeGroupIdx.value,
  }
}

function applySnapshot(inputs: PortfolioInputs, snap: PortfolioState) {
  inputs.currentAge.value = snap.currentAge
  inputs.totalAssets.value = snap.totalAssets
  inputs.inflation.value = snap.inflation
  inputs.groupTabs.value = snap.groupTabs
  inputs.activeGroupIdx.value = snap.activeGroupIdx
  inputs.syncNextId(snap)
}

export function usePortfolioRecordSlots(inputs: PortfolioInputs) {
  const activeSlot = ref(0) // 0 = 即時試算, 1-3 = 紀錄
  let lastSavedJson = ''
  const defaultSnap = snapshot(inputs)
  let timer: ReturnType<typeof setInterval> | null = null
  let liveBackup: PortfolioState | null = null

  function slotHasData(slot: number): boolean {
    return readStorage(storageKey(slot)) !== null
  }

  const slotFilled = ref([false, slotHasData(1), slotHasData(2), slotHasData(3)])
  const slotDirty = ref(false)

  function saveToSlot(slot: number) {
    const json = JSON.stringify(snapshot(inputs))
    writeStorage(storageKey(slot), json)
    lastSavedJson = json
    slotFilled.value[slot] = true
    slotDirty.value = false
  }

  function loadFromSlot(slot: number) {
    const raw = readStorage(storageKey(slot))
    if (raw) {
      try {
        applySnapshot(inputs, JSON.parse(raw))
      } catch { /* ignore bad data */ }
    }
    lastSavedJson = JSON.stringify(snapshot(inputs))
    slotDirty.value = false
  }

  // detect changes → mark dirty
  watch(
    () => JSON.stringify(snapshot(inputs)),
    (current) => {
      if (activeSlot.value >= 1) {
        slotDirty.value = current !== lastSavedJson
      }
    },
  )

  function startAutoSave(slot: number) {
    stopAutoSave()
    lastSavedJson = JSON.stringify(snapshot(inputs))
    slotDirty.value = false
    timer = setInterval(() => {
      if (slotDirty.value) {
        saveToSlot(slot)
      }
    }, 5_000)
  }

  function stopAutoSave() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function switchSlot(slot: number) {
    if (slot === activeSlot.value) return

    // save before leaving a record slot
    if (activeSlot.value >= 1) {
      saveToSlot(activeSlot.value)
    }
    stopAutoSave()

    // backup live state when switching away from 即時試算
    if (activeSlot.value === 0 && slot >= 1) {
      liveBackup = snapshot(inputs)
    }

    activeSlot.value = slot

    if (slot === 0) {
      if (liveBackup) {
        applySnapshot(inputs, liveBackup)
      }
    } else {
      if (slotHasData(slot)) {
        loadFromSlot(slot)
      } else {
        saveToSlot(slot)
      }
      startAutoSave(slot)
    }
  }

  function resetSlot() {
    const slot = activeSlot.value

    if (slot === 0) {
      applySnapshot(inputs, defaultSnap)
      liveBackup = null
    } else {
      deleteStorage(storageKey(slot))
      slotFilled.value[slot] = false
      slotDirty.value = false
      if (liveBackup) {
        applySnapshot(inputs, liveBackup)
      }
      lastSavedJson = JSON.stringify(snapshot(inputs))
    }
  }

  function copyToSlot(target: number) {
    if (target === activeSlot.value) return

    const snap = snapshot(inputs)

    if (target === 0) {
      liveBackup = JSON.parse(JSON.stringify(snap))
    } else {
      writeStorage(storageKey(target), JSON.stringify(snap))
      slotFilled.value[target] = true
    }
  }

  onUnmounted(() => stopAutoSave())

  return { activeSlot, slotFilled, slotDirty, switchSlot, resetSlot, copyToSlot }
}
