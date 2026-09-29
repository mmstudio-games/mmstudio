import { HomeCases } from '@/components/home/home-cases'
import { HomeHero } from '@/components/home/home-hero'
import { HomeManifesto } from '@/components/home/home-manifesto'
import { HomeNotes } from '@/components/home/home-notes'
import { HomeSignal } from '@/components/home/home-signal'

export function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeManifesto />
      <HomeCases />
      <HomeNotes />
      <HomeSignal />
    </>
  )
}
