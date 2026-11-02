/**
 * 海龟汤调查局的公开统计快照，2026-11-01 取自游戏站的公开接口（/api/daily、/api/library/puzzles）。
 * 游戏站接口不允许跨域读取，所以这里是抄录，不是实时数据。
 * 只记日期、难度、语言与人数；题目标题、汤面、汤底、作者一律不抄。
 */

export const HGT_SNAPSHOT_DATE = '2026-11-01'

export type HgtLevel = 1 | 2 | 3
export type HgtLocale = 'zh' | 'ja' | 'en'

/** 官方每日汤：新到旧。level 1 简单、2 中等、3 困难。 */
export const HGT_DAILY: readonly { date: string; level: HgtLevel; locale: HgtLocale }[] = [
  { date: '2026-11-01', level: 2, locale: 'zh' },
  { date: '2026-10-31', level: 2, locale: 'ja' },
  { date: '2026-10-30', level: 2, locale: 'zh' },
  { date: '2026-10-29', level: 2, locale: 'ja' },
  { date: '2026-10-28', level: 2, locale: 'ja' },
  { date: '2026-10-27', level: 2, locale: 'en' },
  { date: '2026-10-26', level: 2, locale: 'ja' },
  { date: '2026-10-25', level: 2, locale: 'zh' },
  { date: '2026-10-24', level: 2, locale: 'en' },
  { date: '2026-10-23', level: 2, locale: 'zh' },
  { date: '2026-10-22', level: 2, locale: 'zh' },
  { date: '2026-10-21', level: 2, locale: 'en' },
  { date: '2026-10-20', level: 2, locale: 'ja' },
  { date: '2026-10-19', level: 2, locale: 'ja' },
  { date: '2026-10-18', level: 2, locale: 'zh' },
  { date: '2026-10-17', level: 2, locale: 'zh' },
  { date: '2026-10-16', level: 2, locale: 'en' },
  { date: '2026-10-15', level: 2, locale: 'en' },
  { date: '2026-10-14', level: 2, locale: 'ja' },
  { date: '2026-10-13', level: 2, locale: 'zh' },
  { date: '2026-10-12', level: 2, locale: 'en' },
  { date: '2026-10-11', level: 2, locale: 'zh' },
  { date: '2026-10-10', level: 2, locale: 'ja' },
  { date: '2026-10-09', level: 2, locale: 'zh' },
  { date: '2026-10-08', level: 2, locale: 'en' },
  { date: '2026-10-07', level: 2, locale: 'en' },
  { date: '2026-10-06', level: 2, locale: 'ja' },
  { date: '2026-10-05', level: 2, locale: 'en' },
  { date: '2026-10-04', level: 2, locale: 'zh' },
  { date: '2026-10-03', level: 3, locale: 'ja' },
  { date: '2026-10-02', level: 2, locale: 'zh' },
  { date: '2026-10-01', level: 2, locale: 'ja' },
  { date: '2026-09-30', level: 2, locale: 'zh' },
  { date: '2026-09-29', level: 2, locale: 'en' },
  { date: '2026-09-28', level: 2, locale: 'en' },
  { date: '2026-09-27', level: 2, locale: 'en' },
  { date: '2026-09-26', level: 2, locale: 'en' },
  { date: '2026-09-25', level: 2, locale: 'ja' },
  { date: '2026-09-24', level: 2, locale: 'zh' },
  { date: '2026-09-23', level: 2, locale: 'en' },
  { date: '2026-09-22', level: 2, locale: 'zh' },
  { date: '2026-09-21', level: 2, locale: 'zh' },
]

/** 汤友题库：新到旧。plays 为游戏站显示的「N 人问过」，solves 为结案人数。 */
export const HGT_LIBRARY: readonly { level: HgtLevel; plays: number; solves: number }[] = [
  { level: 2, plays: 10, solves: 0 },
  { level: 3, plays: 5, solves: 0 },
  { level: 2, plays: 5, solves: 0 },
  { level: 2, plays: 12, solves: 4 },
  { level: 2, plays: 4, solves: 0 },
  { level: 2, plays: 73, solves: 3 },
  { level: 2, plays: 39, solves: 2 },
  { level: 2, plays: 35, solves: 1 },
  { level: 2, plays: 13, solves: 0 },
  { level: 2, plays: 5, solves: 1 },
  { level: 1, plays: 32, solves: 0 },
  { level: 2, plays: 10, solves: 0 },
  { level: 2, plays: 25, solves: 1 },
  { level: 1, plays: 2, solves: 1 },
  { level: 3, plays: 46, solves: 0 },
  { level: 2, plays: 23, solves: 0 },
  { level: 3, plays: 14, solves: 2 },
]
