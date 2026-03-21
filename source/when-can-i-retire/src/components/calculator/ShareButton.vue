<script setup lang="ts">
import { ref } from 'vue'
import { buildShareText, SHARE_URL } from '../../data/shareContent'

const props = defineProps<{
  currentAge: number
  retireAge: number | null
  /** 規劃活到 */
  plannedEndAge: number
}>()
const modalOpen = ref(false)
const content = ref('')

function buildDefaults() {
  content.value = buildShareText(
    props.currentAge,
    props.retireAge,
    props.plannedEndAge,
  )
}

function open() {
  buildDefaults()
  modalOpen.value = true
}
function close() {
  modalOpen.value = false
}

function shareToFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent(content.value)}`, '_blank', 'width=600,height=400')
}
function shareToX() {
  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(content.value)}&url=${encodeURIComponent(SHARE_URL)}`, '_blank', 'width=600,height=400')
}
function shareToLine() {
  window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(content.value)}`, '_blank', 'width=600,height=400')
}
function shareToThreads() {
  window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(content.value)}`, '_blank', 'width=600,height=400')
}

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null
function copyContent() {
  navigator.clipboard.writeText(content.value)
  copied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <!-- Trigger -->
  <button type="button" class="share-btn" @click="open" title="分享到社群">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  </button>

  <!-- Modal -->
  <Teleport to="body">
    <Transition name="share-modal">
      <div v-if="modalOpen" class="share-overlay" @click.self="close">
        <div class="share-dialog">
          <div class="share-dialog-header">
            <span class="share-dialog-title">分享到社群</span>
            <button class="share-close-btn" @click="close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="share-preview-section">
            <div class="share-label-row">
              <label class="share-label">分享內容</label>
              <button class="share-copy-btn" :class="{ copied }" @click="copyContent">
                <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                {{ copied ? '已複製' : '複製' }}
              </button>
            </div>
            <textarea class="share-text-input share-textarea" v-model="content" placeholder="輸入分享內容" rows="6" />
          </div>

          <div class="share-social-row">
            <button class="share-social-btn share-social-fb" @click="shareToFacebook" title="分享到 Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
            <button class="share-social-btn share-social-x" @click="shareToX" title="分享到 X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X
            </button>
            <button class="share-social-btn share-social-line" @click="shareToLine" title="分享到 LINE">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              LINE
            </button>
            <button class="share-social-btn share-social-threads" @click="shareToThreads" title="分享到 Threads">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.698 6.542 2.717 2.227-.02 4.03-.592 5.362-1.703 1.42-1.186 2.159-2.818 2.196-4.851.023-.9-.1-1.723-.367-2.448-.253-.685-.652-1.27-1.182-1.735-.157.905-.44 1.702-.84 2.375-.582.982-1.4 1.756-2.428 2.297-1.072.565-2.31.856-3.678.864h-.056c-1.882-.02-3.405-.65-4.529-1.874-.975-1.063-1.506-2.472-1.533-4.076.05-2.545 1.178-4.3 3.28-5.115 1.003-.388 2.166-.588 3.455-.595h.072c1.563.012 2.867.332 3.874.951.89.545 1.56 1.318 1.994 2.294.247-.084.483-.183.706-.298.71-.366 1.246-.87 1.594-1.497.37-.668.544-1.467.508-2.374-.018-.464-.1-.893-.244-1.273-.135-.355-.333-.672-.59-.94-.512-.534-1.252-.875-2.198-1.013-.538-.079-1.148-.097-1.817-.054l-.274-2.085c.82-.053 1.58-.03 2.26.068 1.448.209 2.59.753 3.394 1.617.47.507.82 1.11 1.037 1.794.206.642.316 1.346.328 2.093.05 1.285-.228 2.404-.828 3.327-.572.88-1.373 1.567-2.383 2.04-.115.054-.233.103-.354.151.126.579.195 1.193.18 1.838-.05 2.652-1.053 4.857-2.98 6.468-1.717 1.434-3.979 2.17-6.719 2.19z M11.295 12.45c-.132.004-.267.013-.405.026-1.473.168-2.415 1.122-2.446 2.486.018 1.063.345 1.892.975 2.467.71.648 1.713.977 2.98.99h.043c1.677-.016 3-.576 3.834-1.619.646-.81.977-1.87.977-3.14v-.06c-.263-.546-.653-.967-1.18-1.26-.688-.383-1.598-.592-2.706-.6h-.058c-.96.005-1.822.168-2.562.463-.368.146-.586.24-.737.316l-.096.05c-.14.076-.31.169-.52.276l-.097-.395z"/></svg>
              Threads
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.share-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(96, 165, 250, 0.45);
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
}
.share-btn:hover {
  background: rgba(59, 130, 246, 0.28);
  border-color: rgba(96, 165, 250, 0.65);
  color: #e0f2fe;
  transform: scale(1.05);
}

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
  max-width: 480px;
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
  margin-bottom: 18px;
}
.share-dialog-title {
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
  font-family: "DM Sans", sans-serif;
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

.share-preview-section {
  margin-bottom: 18px;
}
.share-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.share-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  font-family: "DM Sans", sans-serif;
}
.share-copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.share-copy-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(148, 163, 184, 0.35);
  color: #e2e8f0;
}
.share-copy-btn.copied {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.4);
  background: rgba(52, 211, 153, 0.1);
}
.share-text-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  color: #cbd5e1;
  font-size: 14px;
  font-family: "DM Sans", sans-serif;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.share-text-input:focus {
  border-color: rgba(96, 165, 250, 0.5);
}
.share-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

.share-social-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.share-social-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.share-social-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(148, 163, 184, 0.3);
}
.share-social-fb { color: #1877f2; }
.share-social-fb:hover { background: rgba(24, 119, 242, 0.15); border-color: rgba(24, 119, 242, 0.4); }
.share-social-x { color: #e2e8f0; }
.share-social-x:hover { background: rgba(255, 255, 255, 0.12); }
.share-social-line { color: #06c755; }
.share-social-line:hover { background: rgba(6, 199, 85, 0.15); border-color: rgba(6, 199, 85, 0.4); }
.share-social-threads { color: #e2e8f0; }
.share-social-threads:hover { background: rgba(255, 255, 255, 0.12); }

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
</style>
