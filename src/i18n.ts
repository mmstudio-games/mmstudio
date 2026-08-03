import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export type Locale = 'zh-CN' | 'en'

const resources = {
  'zh-CN': {
    translation: {
      nav: { home: '首页', deadpan: '积案拂尘', news: '动态', github: 'GitHub' },
      hero: {
        eyebrow: 'MMSTUDIO · 独立游戏工作室',
        titleA: '妄言',
        titleB: '真意',
        lede: '我们制造关于言辞、判断与人的游戏。',
        statement: 'MEANINGLESS WORDS. MEANINGFUL CHOICES.',
      },
      deadpan: {
        label: '当前核心产品 · CASE 001',
        name: '积案拂尘',
        english: 'DEADPAN',
        description:
          '一款 AI 驱动的悬疑盘问游戏。向嫌疑人与调查角色自由发问，在矛盾的口供、遗漏的细节和时代留下的褶皱里拼出真相。',
        play: '进入游戏',
        details: '查看产品页',
        status: '持续开发中',
        meta1: '自由文本盘问',
        meta2: '动态生成案卷',
        meta3: '非线性推理',
      },
      pillars: {
        label: 'DESIGN NOTES / 设计札记',
        oneTitle: '没有标准问句',
        oneBody: '案卷不会把答案排成选项。你如何发问，决定真相如何显露。',
        twoTitle: '每一案都是新案',
        twoBody: '人物、证言与证据链实时展开。重复进入，也不会面对同一份沉默。',
        threeTitle: '真相回到人身上',
        threeBody: '案件不只追问谁做了什么，也追问一个人为何走到这里。',
      },
      signal: {
        label: 'LATEST SIGNAL / 最新讯号',
        date: '2026.08',
        title: '旧案重启，真相必达。',
        body: '《积案拂尘》正在持续更新。新的案件结构、盘问体验与案后报道仍在装订。',
        action: '关注开发进展',
      },
      reserved: {
        deadpan: '产品档案正在整理',
        news: '开发记录即将归档',
        about: '工作室档案暂未公开',
        contact: '联络方式正在整理',
        back: '返回首页',
      },
      footer: { mark: '妄言真意', rights: 'MMSTUDIO / MEANINGLESSMEANINGSTUDIO' },
    },
  },
  en: {
    translation: {
      nav: { home: 'Home', deadpan: 'Deadpan', news: 'News', github: 'GitHub' },
      hero: {
        eyebrow: 'MMSTUDIO · INDEPENDENT GAME STUDIO',
        titleA: 'MEANINGLESS',
        titleB: 'MEANING',
        lede: 'We make games about words, judgment, and people.',
        statement: 'MEANINGLESS WORDS. MEANINGFUL CHOICES.',
      },
      deadpan: {
        label: 'CURRENT PRODUCTION · CASE 001',
        name: 'DEADPAN',
        english: '积案拂尘',
        description:
          'An AI-driven interrogation mystery. Question suspects and investigators in your own words, then piece together the truth from contradictions, omissions, and the creases left by time.',
        play: 'Play Deadpan',
        details: 'Product file',
        status: 'In active development',
        meta1: 'Free-text inquiry',
        meta2: 'Generated case files',
        meta3: 'Nonlinear deduction',
      },
      pillars: {
        label: 'DESIGN NOTES',
        oneTitle: 'No prescribed questions',
        oneBody: 'A case never arranges its answers as choices. How you ask determines how the truth appears.',
        twoTitle: 'Every case starts anew',
        twoBody: 'People, testimony, and evidence unfold in real time. The same silence never waits twice.',
        threeTitle: 'Truth returns to people',
        threeBody: 'A case asks not only what happened, but why someone reached that point.',
      },
      signal: {
        label: 'LATEST SIGNAL',
        date: '2026.08',
        title: 'Cold cases reopen. Truth arrives.',
        body: 'Deadpan remains in active development. New case structures, inquiry tools, and aftermath reports are being bound into the next issue.',
        action: 'Follow development',
      },
      reserved: {
        deadpan: 'The product file is being assembled',
        news: 'Development notes are awaiting archive',
        about: 'The studio file is not yet public',
        contact: 'Contact details are being prepared',
        back: 'Return home',
      },
      footer: { mark: 'MMSTUDIO', rights: 'MEANINGLESSMEANINGSTUDIO / 妄言真意' },
    },
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
})

export default i18n
