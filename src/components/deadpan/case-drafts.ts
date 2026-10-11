/**
 * 设计稿：某一宗故事的设计文档，只收团队提供的原件，照抄不改写。
 * 每宗一份文件放在 `drafts/`，这里按案号登记，打开卷宗夹时才加载。
 */

type Pair = readonly [label: string, value: string]

/** 一节里的内容块。 */
export type DraftBlock =
  | { kind: 'text'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'notice'; text: string }
  | { kind: 'facts'; items: readonly Pair[] }
  | { kind: 'tags'; items: readonly string[] }
  | {
      kind: 'list'
      label?: string
      ordered?: boolean
      items: readonly string[]
      /** 讯问笔录里的用途：ask 是给访客的建议追问，answer 是这位人物能说的原话。 */
      use?: 'ask' | 'answer'
    }
  | { kind: 'table'; head: readonly string[]; rows: readonly (readonly string[])[] }
  | { kind: 'timeline'; head: Pair; rows: readonly { when: string; what: string; key?: boolean }[] }
  | { kind: 'entry'; title: string; text: string }
  | {
      kind: 'profile'
      code: string
      name: string
      role: string
      /** 十分制的数值，如压力、镇定、暴露度。 */
      meters: readonly (readonly [label: string, value: number])[]
      fields: readonly Pair[]
    }

/** 章下的一节。sealed 为真时默认封存：只露节名，内容盖机密条。 */
export type DraftPart = { title?: string; sealed?: boolean; blocks: readonly DraftBlock[] }

export type DraftSection = {
  no: string
  title: string
  /** 章名本身含剧透时，封存状态下显示的短名。 */
  sealedTitle?: string
  /** 整章封存。 */
  sealed?: boolean
  parts: readonly DraftPart[]
}

export type CaseDraft = {
  title: string
  subtitle: string
  english?: string
  /** 原件封面上的说明，原样显示。 */
  notice: string
  closing: string
  facts: readonly Pair[]
  /** 封面上含剧透的事实，拆封后才显示。 */
  sealedFacts?: readonly Pair[]
  sections: readonly DraftSection[]
}

const DRAFTS: Record<string, () => Promise<{ default: CaseDraft }>> = {
  'CASE #3003-T1-IN0X': () => import('./drafts/haihe-dismemberment'),
}

export const hasDraft = (caseNo: string) => caseNo in DRAFTS

/** 讯问笔录用得上的内容：这位人物的一句话、建议追问、他能说的原话（带它在原件里的小标题）。 */
export type InterviewBrief = {
  quote: string | null
  asks: readonly string[]
  lines: readonly { label: string; text: string }[]
}

/**
 * 从设计稿里取某位人物的讯问材料。
 * 只看不封存的章节：封存的内容不在别处露出。找不到就返回 null。
 */
export function interviewBrief(draft: CaseDraft, name: string): InterviewBrief | null {
  for (const section of draft.sections) {
    if (section.sealed) continue
    for (const part of section.parts) {
      if (part.sealed || !part.title?.includes(name)) continue
      let quote: string | null = null
      let asks: readonly string[] = []
      const lines: { label: string; text: string }[] = []
      for (const block of part.blocks) {
        if (block.kind === 'quote' && !quote) quote = block.text
        if (block.kind !== 'list') continue
        if (block.use === 'ask') asks = block.items
        if (block.use === 'answer') for (const text of block.items) lines.push({ label: block.label ?? '', text })
      }
      if (quote || asks.length || lines.length) return { quote, asks, lines }
    }
  }
  return null
}

export async function loadDraft(caseNo: string) {
  const load = DRAFTS[caseNo]
  return load ? (await load()).default : null
}
