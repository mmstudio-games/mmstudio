import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Link, NavLink, Outlet } from "react-router-dom"
import { GitBranch, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
    <div className="min-h-svh bg-background text-foreground">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link to="/" className="wordmark" aria-label="MMStudio home">
          <span>MM</span><span>STUDIO</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {navItems.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={toggleLocale} aria-label="Switch language">
            {locale === "zh-CN" ? "EN" : "中文"}
          </Button>
          <Button variant="ghost" size="icon-sm" nativeButton={false} render={<a href="https://github.com/Meaningless-Meaning-Studio" target="_blank" rel="noreferrer" aria-label="MMStudio GitHub" />}>
            <GitBranch />
          </Button>
          <Sheet>
            <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon-sm" aria-label="Open navigation"><Menu /></Button>} />
            <SheetContent side="right" className="border-l-border bg-background p-8">
              <SheetTitle className="font-heading text-2xl uppercase">MMStudio</SheetTitle>
              <nav className="mt-16 flex flex-col gap-8">
                {navItems.map(([to, label]) => <SheetClose key={to} render={<Link to={to} className="font-heading text-3xl uppercase">{t(label)}</Link>} />)}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="site-footer">
        <span className="font-heading text-lg uppercase">{t("footer.mark")}</span>
        <span>{t("footer.rights")}</span>
        <span>© 2026</span>
      </footer>
    </div>
  )
}
