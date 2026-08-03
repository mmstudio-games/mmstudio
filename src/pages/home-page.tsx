import { useTranslation } from "react-i18next"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function HomePage() {
  const { t } = useTranslation()

  return (
    <>
      <section className="hero-grid page-section">
        <div className="hero-copy">
          <p className="section-kicker">{t("hero.eyebrow")}</p>
          <h1 className="hero-title">
            <span>{t("hero.titleA")}</span>
            <span className="hero-title-indent">{t("hero.titleB")}</span>
          </h1>
          <p className="hero-lede">{t("hero.lede")}</p>
        </div>
        <div className="hero-file" aria-hidden="true">
          <span className="file-index">MM / 001</span>
          <div className="file-lines" />
          <p>{t("hero.statement")}</p>
          <ArrowDownRight className="size-9" />
        </div>
      </section>

      <section className="product-stage page-section" aria-labelledby="deadpan-title">
        <div className="product-visual">
          <div className="product-paper">
            <div className="product-paper-head"><span>CASE FILE</span><span>001—2026</span></div>
            <div className="product-seal">机<br />密</div>
            <p className="product-chinese">积案拂尘</p>
            <p className="product-english">DEADPAN</p>
            <div className="product-stamp">ACTIVE<br />ARCHIVE</div>
          </div>
        </div>
        <div className="product-copy">
          <p className="section-kicker">{t("deadpan.label")}</p>
          <div>
            <h2 id="deadpan-title" className="product-title">{t("deadpan.name")}</h2>
            <p className="product-subtitle">{t("deadpan.english")}</p>
          </div>
          <p className="product-description">{t("deadpan.description")}</p>
          <div className="product-meta">
            {["meta1", "meta2", "meta3"].map((key, index) => (
              <div key={key}><span>0{index + 1}</span><p>{t(`deadpan.${key}`)}</p></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" nativeButton={false} render={<a href="https://deadpan.hydroroll.team/" target="_blank" rel="noreferrer" />}>
              {t("deadpan.play")} <ArrowUpRight data-icon="inline-end" />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link to="/games/deadpan" />}>
              {t("deadpan.details")}
            </Button>
          </div>
          <p className="development-status"><span />{t("deadpan.status")}</p>
        </div>
      </section>

      <section className="page-section notes-section">
        <p className="section-kicker">{t("pillars.label")}</p>
        <div className="notes-grid">
          {["one", "two", "three"].map((key, index) => (
            <article key={key} className="note-item">
              <span>0{index + 1}</span>
              <Separator />
              <h3>{t(`pillars.${key}Title`)}</h3>
              <p>{t(`pillars.${key}Body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="signal-section page-section">
        <div><p className="section-kicker">{t("signal.label")}</p><span className="signal-date">{t("signal.date")}</span></div>
        <div className="signal-copy">
          <h2>{t("signal.title")}</h2>
          <p>{t("signal.body")}</p>
          <a href="https://github.com/Meaningless-Meaning-Studio" target="_blank" rel="noreferrer" className="text-link">
            {t("signal.action")} <ArrowUpRight />
          </a>
        </div>
      </section>
    </>
  )
}
