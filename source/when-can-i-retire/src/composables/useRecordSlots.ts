import { ref, watch, onUnmounted, type Ref } from "vue";

/** All input keys that should be saved/loaded */
const INPUT_KEYS = [
  "currentAge",
  "currentCash",
  "monthlySave",
  "rSave",
  "endAge",
  "eBase",
  "eExtra",
  "pension",
  "pensionAge",
  "rLmp",
  "rRp",
  "inflation",
] as const;

type InputRefs = Record<(typeof INPUT_KEYS)[number], Ref<number>>;

function cookieKey(slot: number) {
  return `retire_record_${slot}`;
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`;
}

function snapshot(inputs: InputRefs): Record<string, number> {
  const o: Record<string, number> = {};
  for (const k of INPUT_KEYS) o[k] = inputs[k].value;
  return o;
}

function applySnapshot(inputs: InputRefs, snap: Record<string, number>) {
  for (const k of INPUT_KEYS) {
    if (k in snap) inputs[k].value = snap[k];
  }
}

export function useRecordSlots(inputs: InputRefs) {
  const activeSlot = ref(0); // 0 = 即時試算, 1-3 = 紀錄
  let lastSavedJson = "";
  /** 初始預設值，用於即時試算重設 */
  const defaultSnap = snapshot(inputs);
  let timer: ReturnType<typeof setInterval> | null = null;

  /** 即時試算的備份，切到紀錄時保存、切回時還原 */
  let liveBackup: Record<string, number> | null = null;

  /** Check if a slot has saved data */
  function slotHasData(slot: number): boolean {
    return readCookie(cookieKey(slot)) !== null;
  }

  const slotFilled = ref([false, slotHasData(1), slotHasData(2), slotHasData(3)]);
  /** true = 目前 inputs 與 cookie 中的資料不同（尚未保存） */
  const slotDirty = ref(false);

  function saveToSlot(slot: number) {
    const json = JSON.stringify(snapshot(inputs));
    writeCookie(cookieKey(slot), json);
    lastSavedJson = json;
    slotFilled.value[slot] = true;
    slotDirty.value = false;
  }

  function loadFromSlot(slot: number) {
    const raw = readCookie(cookieKey(slot));
    if (raw) {
      try {
        applySnapshot(inputs, JSON.parse(raw));
      } catch {
        /* ignore bad data */
      }
    }
    lastSavedJson = JSON.stringify(snapshot(inputs));
    slotDirty.value = false;
  }

  // 即時偵測 inputs 變動 → 標記 dirty
  watch(
    INPUT_KEYS.map((k) => inputs[k]),
    () => {
      if (activeSlot.value >= 1) {
        const current = JSON.stringify(snapshot(inputs));
        slotDirty.value = current !== lastSavedJson;
      }
    },
  );

  function startAutoSave(slot: number) {
    stopAutoSave();
    lastSavedJson = JSON.stringify(snapshot(inputs));
    slotDirty.value = false;
    timer = setInterval(() => {
      if (slotDirty.value) {
        saveToSlot(slot);
      }
    }, 5_000);
  }

  function stopAutoSave() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  /** Switch active slot */
  function switchSlot(slot: number) {
    if (slot === activeSlot.value) return;

    // 離開紀錄 slot 前先存檔
    if (activeSlot.value >= 1) {
      saveToSlot(activeSlot.value);
    }
    stopAutoSave();

    // 從即時試算切出去 → 備份即時狀態
    if (activeSlot.value === 0 && slot >= 1) {
      liveBackup = snapshot(inputs);
    }

    activeSlot.value = slot;

    if (slot === 0) {
      // 切回即時試算 → 還原備份
      if (liveBackup) {
        applySnapshot(inputs, liveBackup);
      }
    } else {
      // 切到紀錄 slot
      if (slotHasData(slot)) {
        loadFromSlot(slot);
      } else {
        // 首次使用此 slot — 存下目前的值
        saveToSlot(slot);
      }
      startAutoSave(slot);
    }
  }

  /** 重設當前 slot */
  function resetSlot() {
    const slot = activeSlot.value;

    if (slot === 0) {
      // 即時試算 → 還原為程式預設值
      applySnapshot(inputs, defaultSnap);
      liveBackup = null;
    } else {
      // 紀錄 slot → 清除 cookie、還原為即時試算備份
      deleteCookie(cookieKey(slot));
      slotFilled.value[slot] = false;
      slotDirty.value = false;
      if (liveBackup) {
        applySnapshot(inputs, liveBackup);
      }
      lastSavedJson = JSON.stringify(snapshot(inputs));
    }
  }

  onUnmounted(() => stopAutoSave());

  return { activeSlot, slotFilled, slotDirty, switchSlot, resetSlot };
}
