import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function ReservedPage({ page }: { page: "deadpan" | "news" | "about" | "contact" }) {
  const { t } = useTranslation()
  return (
    <section className="reserved-page page-section">
      <p className="section-kicker">RESERVED / {page.toUpperCase()}</p>
      <h1>{t(`reserved.${page}`)}</h1>
      <Button variant="outline" nativeButton={false} render={<Link to="/" />}><ArrowLeft data-icon="inline-start" />{t("reserved.back")}</Button>
    </section>
  )
}
