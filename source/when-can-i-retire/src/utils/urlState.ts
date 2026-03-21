import type { GroupTab, PortfolioItem } from '../types/portfolio'

interface CompactState {
  currentAge: number
  totalAssets: number
  inflation: number
  groupTabs: Array<{
    label: string
    items: Array<{
      type: PortfolioItem['type']
      data: Record<string, unknown>
      enabled?: boolean
    }>
  }>
}

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToUtf8(b64: string): string {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export function encodePortfolioState(
  currentAge: number,
  totalAssets: number,
  inflation: number,
  groupTabs: GroupTab[],
): string {
  const state: CompactState = {
    currentAge,
    totalAssets,
    inflation,
    groupTabs: groupTabs.map(g => ({
      label: g.label,
      items: g.items.map(item => {
        const { id: _, ...rest } = item.data as unknown as Record<string, unknown> & { id: string }
        const entry: CompactState['groupTabs'][number]['items'][number] = { type: item.type, data: rest }
        if (item.enabled === false) entry.enabled = false
        return entry
      }),
    })),
  }
  return utf8ToBase64Url(JSON.stringify(state))
}

export function decodePortfolioState(
  encoded: string,
  uid: () => string,
): { currentAge: number; totalAssets: number; inflation: number; groupTabs: GroupTab[] } | null {
  try {
    const json = base64UrlToUtf8(encoded)
    const state: CompactState = JSON.parse(json)
    if (
      typeof state.currentAge !== 'number' ||
      typeof state.totalAssets !== 'number' ||
      typeof state.inflation !== 'number' ||
      !Array.isArray(state.groupTabs)
    ) {
      return null
    }
    return {
      currentAge: state.currentAge,
      totalAssets: state.totalAssets,
      inflation: state.inflation,
      groupTabs: state.groupTabs.map(g => ({
        id: uid(),
        label: g.label,
        items: g.items.map(item => {
          const pi: Record<string, unknown> = { type: item.type, data: { ...item.data, id: uid() } }
          if (item.enabled === false) pi.enabled = false
          return pi
        }) as PortfolioItem[],
      })),
    }
  } catch {
    return null
  }
}

export function getPortfolioHashData(): string | null {
  const hash = window.location.hash.replace('#', '')
  const slashIdx = hash.indexOf('/')
  if (slashIdx === -1) return null
  if (hash.substring(0, slashIdx) !== 'portfolio') return null
  const data = hash.substring(slashIdx + 1)
  return data || null
}
