/**
 * 游戏站公开案卷总目中的编辑部卷宗（2026-09-29 抄录）。
 * 只收案名、案型、难度与版别；不收玩家来稿、报道节选与头条图。
 */
export const CASE_TYPES = ['homicide', 'theft', 'arson', 'folklore', 'object', 'anomaly'] as const
export const CASE_LEVELS = ['gentle', 'standard', 'challenging', 'expert'] as const

export type CaseType = (typeof CASE_TYPES)[number]
export type CaseLevel = (typeof CASE_LEVELS)[number]
export type ArchivedCase = { name: string; type: CaseType; level: CaseLevel; edition: 'zh' | 'en' }

export const CASE_ARCHIVE: readonly ArchivedCase[] = [
  { name: '黄梅天里的旧股单', type: 'theft', level: 'standard', edition: 'zh' },
  { name: '潮汐电厂的火光', type: 'arson', level: 'standard', edition: 'zh' },
  { name: '沙暴中的火光', type: 'arson', level: 'standard', edition: 'zh' },
  { name: '海河碎尸案', type: 'homicide', level: 'standard', edition: 'zh' },
  { name: '台风夜·账本迷踪', type: 'theft', level: 'standard', edition: 'zh' },
  { name: '回南天·供销社火光', type: 'arson', level: 'standard', edition: 'zh' },
  { name: '西湖春雨账单', type: 'theft', level: 'standard', edition: 'zh' },
  { name: '雪夜鬼影', type: 'folklore', level: 'standard', edition: 'zh' },
  { name: '座钟异声', type: 'object', level: 'standard', edition: 'zh' },
  { name: '江渊沉棺', type: 'anomaly', level: 'expert', edition: 'zh' },
  { name: '旧滩口水文站杀人', type: 'homicide', level: 'challenging', edition: 'zh' },
  { name: '灶台下的金条', type: 'folklore', level: 'standard', edition: 'zh' },
  { name: 'The Wages Ledger', type: 'theft', level: 'standard', edition: 'en' },
  { name: 'The Blue Ledger', type: 'theft', level: 'gentle', edition: 'en' },
]

export const CATALOG_URL = 'https://deadpan.hydroroll.team/cases'
