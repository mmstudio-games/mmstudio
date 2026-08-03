import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Link, NavLink, Outlet } from "react-router-dom"
import { GitBranch, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePreferencesStore } from "@/stores/preferences-store"

const navItems = [
  ["/", "nav.home"],
  ["/games/deadpan", "nav.deadpan"],
  ["/news", "nav.news"],
] as const

export function SiteLayout() {
  const { t, i18n } = useTranslation()
  const locale = usePreferencesStore((state) => state.locale)
  const setLocale = usePreferencesStore((state) => state.setLocale)

  useEffect(() => {
    void i18n.changeLanguage(locale)
    document.documentElement.lang = locale
  }, [i18n, locale])

  const toggleLocale = () => setLocale(locale === "zh-CN" ? "en" : "zh-CN")

  return (
    <div className="min-h-svh bg-background text-foreground [background-image:linear-gradient(90deg,rgba(70,49,27,.035)_1px,transparent_1px),linear-gradient(rgba(70,49,27,.025)_1px,transparent_1px)] [background-size:48px_48px]">
      <a
        className="fixed -top-16 left-4 z-[100] bg-primary px-4 py-3 text-primary-foreground focus:top-4"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-50 grid h-[72px] grid-cols-[1fr_auto] items-center border-b border-border bg-background/90 px-[clamp(1.25rem,4vw,4.5rem)] backdrop-blur-[14px] md:grid-cols-[1fr_auto_1fr]">
        <Link to="/" className="flex w-fit items-baseline font-heading leading-none text-inherit no-underline" aria-label="MMStudio home">
          <span className="text-[1.65rem] font-semibold tracking-[-.1em]">MM</span>
          <span className="ml-[.45rem] font-sans text-[.58rem] font-bold tracking-[.22em]">STUDIO</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {navItems.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                "relative text-[.7rem] font-bold tracking-[.16em] text-muted-foreground uppercase no-underline after:absolute after:inset-x-0 after:-bottom-[.55rem] after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform hover:text-foreground hover:after:origin-left hover:after:scale-x-100",
                isActive && "text-foreground after:origin-left after:scale-x-100",
              )}
            >
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-self-end gap-1">
          <Button variant="ghost" size="sm" onClick={toggleLocale} aria-label="Switch language">
            {locale === "zh-CN" ? "EN" : "中文"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            render={<a href="https://github.com/Meaningless-Meaning-Studio" target="_blank" rel="noreferrer" aria-label="MMStudio GitHub" />}
          >
            <GitBranch />
          </Button>
          <Sheet>
            <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon-sm" aria-label="Open navigation"><Menu /></Button>} />
            <SheetContent side="right" className="border-l-border bg-background p-8">
              <SheetTitle className="font-heading text-2xl uppercase">MMStudio</SheetTitle>
              <nav className="mt-16 flex flex-col gap-8">
                {navItems.map(([to, label]) => (
                  <SheetClose key={to} render={<Link to={to} className="font-heading text-3xl uppercase">{t(label)}</Link>} />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="grid min-h-[120px] grid-cols-1 items-center gap-3 border-t border-border px-[clamp(1.25rem,6vw,7rem)] py-8 text-[.6rem] tracking-[.14em] uppercase sm:grid-cols-[1fr_auto_auto] sm:gap-12">
        <span className="font-heading text-lg uppercase">{t("footer.mark")}</span>
        <span>{t("footer.rights")}</span>
        <span>© 2026</span>
      </footer>
    </div>
  )
}
