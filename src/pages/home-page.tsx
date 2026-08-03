import { useTranslation } from "react-i18next"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export function HomePage() {
  const { t } = useTranslation()

  return (
    <>
      <section className={cn(
        "px-[clamp(1.25rem,6vw,7rem)]",
        "grid min-h-[calc(100svh-72px)] grid-cols-1 items-stretch border-b border-border min-[901px]:grid-cols-[minmax(0,1.65fr)_minmax(240px,.55fr)]",
      )}>
        <div className="flex min-h-[68svh] flex-col justify-center py-16 min-[601px]:min-h-[72svh] min-[901px]:min-h-0 min-[901px]:py-24 min-[901px]:pr-[7vw]">
          <p className="text-[.67rem] leading-normal font-bold tracking-[.2em] uppercase">{t("hero.eyebrow")}</p>
          <h1 className="my-8 flex flex-col font-heading text-[clamp(4rem,18vw,8rem)] leading-[.78] font-medium tracking-[-.05em] uppercase min-[901px]:text-[clamp(4.2rem,10.7vw,10.5rem)] [[lang=en]_&]:[container-type:inline-size] [[lang=en]_&]:text-[clamp(4rem,12.5cqw,10rem)] [[lang=en]_&]:tracking-[-.03em]">
            <span>{t("hero.titleA")}</span>
            <span className="italic min-[601px]:pl-[.5em]">{t("hero.titleB")}</span>
          </h1>
          <p className="max-w-[38rem] text-[clamp(1.1rem,1.6vw,1.45rem)] leading-[1.7] min-[901px]:ml-auto">{t("hero.lede")}</p>
        </div>
        <div className={cn(
          "bg-[#2b2116] [background-image:radial-gradient(circle_at_50%_0,#5e4c34,transparent_52%),repeating-linear-gradient(110deg,rgba(255,255,255,.02)_0_1px,transparent_1px_7px)]",
          "-mx-[clamp(1.25rem,6vw,7rem)] flex min-h-[260px] flex-col justify-between border-border p-8 text-[#ebe0c8] min-[901px]:mr-[calc(clamp(1.25rem,6vw,7rem)*-1)] min-[901px]:ml-0 min-[901px]:border-l",
        )}>
          <span className="font-mono text-[.72rem] tracking-[.16em]">MM / 001</span>
          <div className="my-6 flex-1 opacity-25 [background:repeating-linear-gradient(180deg,transparent_0_27px,#ebe0c8_28px)] min-[901px]:my-12" />
          <p className="max-w-[13rem] font-heading text-[1.2rem] leading-[1.4]">{t("hero.statement")}</p>
          <ArrowDownRight className="size-9" />
        </div>
      </section>

      <section className={cn(
        "px-[clamp(1.25rem,6vw,7rem)]",
        "grid grid-cols-1 border-b border-border min-[901px]:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)]",
      )} aria-labelledby="deadpan-title">
        <div className={cn(
          "bg-[#2b2116] [background-image:radial-gradient(circle_at_50%_0,#5e4c34,transparent_52%),repeating-linear-gradient(110deg,rgba(255,255,255,.02)_0_1px,transparent_1px_7px)]",
          "-mx-[clamp(1.25rem,6vw,7rem)] grid min-h-[520px] place-items-center overflow-hidden min-[601px]:min-h-[660px] min-[901px]:mr-0 min-[901px]:min-h-[760px]",
        )}>
          <div className="relative aspect-[.72] w-[76%] rotate-[-3deg] border border-[#7c6545] bg-[linear-gradient(135deg,#f5efdf,#e4d5b8)] p-6 text-[#261e16] shadow-[18px_22px_55px_rgba(0,0,0,.35)] after:pointer-events-none after:absolute after:inset-0 after:bg-[repeating-linear-gradient(0deg,transparent_0_5px,rgba(55,40,24,.05)_6px)] after:opacity-25 after:content-[''] min-[601px]:w-[min(66%,420px)]">
            <div className="flex justify-between border-b-2 border-current pb-3 font-mono text-[.58rem] leading-none font-bold tracking-[.12em]"><span>CASE FILE</span><span>001—2026</span></div>
            <div className="absolute top-20 right-6 rotate-[8deg] border-2 border-[#8f2f21] p-2 text-center font-heading leading-[1.1] font-bold text-[#8f2f21]">机<br />密</div>
            <p className="mt-24 font-heading text-[clamp(3rem,5vw,4.8rem)] leading-none font-bold tracking-[.12em] [writing-mode:vertical-rl] min-[601px]:mt-32">积案拂尘</p>
            <p className="absolute right-6 bottom-16 origin-bottom-right rotate-90 font-heading text-[1.8rem] tracking-[.08em]">DEADPAN</p>
            <div className="absolute bottom-6 left-6 font-mono text-[.62rem] leading-[1.2] font-bold tracking-[.14em] text-[#8f2f21]">ACTIVE<br />ARCHIVE</div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-10 py-[clamp(4rem,8vw,8rem)] min-[901px]:pl-[clamp(2rem,7vw,8rem)]">
          <p className="text-[.67rem] leading-normal font-bold tracking-[.2em] uppercase">{t("deadpan.label")}</p>
          <div>
            <h2 id="deadpan-title" className="m-0 font-heading text-[clamp(3.6rem,7vw,7rem)] leading-[.9] font-medium tracking-[-.05em]">{t("deadpan.name")}</h2>
            <p className="mt-4 text-[.72rem] font-bold tracking-[.35em]">{t("deadpan.english")}</p>
          </div>
          <p className="max-w-[38rem] text-[1.05rem] leading-[1.9] text-muted-foreground">{t("deadpan.description")}</p>
          <div className="border-t border-border">
            {["meta1", "meta2", "meta3"].map((key, index) => (
              <div key={key} className="grid grid-cols-[3rem_1fr] border-b border-border py-[.85rem] text-[.8rem]">
                <span className="font-mono text-muted-foreground">0{index + 1}</span><p>{t(`deadpan.${key}`)}</p>
              </div>
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
          <p className="flex items-center gap-[.65rem] text-[.72rem] tracking-[.1em] text-muted-foreground uppercase"><span className="size-[7px] animate-pulse bg-[#8f2f21]" />{t("deadpan.status")}</p>
        </div>
      </section>

      <section className={cn(
        "px-[clamp(1.25rem,6vw,7rem)]",
        "border-b border-border py-28 min-[901px]:pb-32",
      )}>
        <p className="text-[.67rem] leading-normal font-bold tracking-[.2em] uppercase">{t("pillars.label")}</p>
        <div className="mt-14 grid grid-cols-1 min-[901px]:grid-cols-3">
          {["one", "two", "three"].map((key, index) => (
            <article key={key} className="border-t border-border py-10 min-[901px]:min-h-[300px] min-[901px]:border-t-0 min-[901px]:border-l min-[901px]:px-9 min-[901px]:pb-8 min-[901px]:first:border-l-0 min-[901px]:first:pl-0">
              <span className="font-mono text-[.72rem]">0{index + 1}</span>
              <Separator className="my-8" />
              <h3 className="mb-5 max-w-60 font-heading text-[2rem] leading-[1.1] font-medium">{t(`pillars.${key}Title`)}</h3>
              <p className="max-w-76 text-[.9rem] leading-[1.75] text-muted-foreground">{t(`pillars.${key}Body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={cn(
        "px-[clamp(1.25rem,6vw,7rem)]",
        "bg-[#2b2116] [background-image:radial-gradient(circle_at_50%_0,#5e4c34,transparent_52%),repeating-linear-gradient(110deg,rgba(255,255,255,.02)_0_1px,transparent_1px_7px)]",
        "grid min-h-[560px] grid-cols-1 text-[#ebe0c8] min-[901px]:grid-cols-[.7fr_1.3fr]",
      )}>
        <div className="flex min-h-[240px] flex-col justify-between border-b border-white/25 py-20 min-[901px]:min-h-0 min-[901px]:border-r min-[901px]:border-b-0 min-[901px]:pr-16">
          <p className="text-[.67rem] leading-normal font-bold tracking-[.2em] uppercase">{t("signal.label")}</p><span className="font-heading text-[clamp(3rem,6vw,6rem)]">{t("signal.date")}</span>
        </div>
        <div className="py-24 min-[901px]:pl-[clamp(2rem,8vw,9rem)]">
          <h2 className="mb-8 max-w-[760px] font-heading text-[clamp(3rem,6vw,6.2rem)] leading-[.95] font-medium tracking-[-.045em]">{t("signal.title")}</h2>
          <p className="max-w-[42rem] leading-[1.8] text-[#ebe0c8]/70">{t("signal.body")}</p>
          <a href="https://github.com/Meaningless-Meaning-Studio" target="_blank" rel="noreferrer" className="mt-12 flex w-fit items-center gap-2 border-b border-current pb-[.35rem] text-[.72rem] font-bold tracking-[.14em] text-inherit uppercase no-underline">
            {t("signal.action")} <ArrowUpRight className="size-4" />
          </a>
        </div>
      </section>
    </>
  )
}
