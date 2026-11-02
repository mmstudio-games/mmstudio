import { Navigate, Route, Routes } from 'react-router-dom'

import { SiteLayout } from '@/components/site-layout'
import { DeadpanPage } from '@/pages/deadpan-page'
import { HgtPage } from '@/pages/hgt-page'
import { HomePage } from '@/pages/home-page'
import { ReservedPage } from '@/pages/reserved-page'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path='games/deadpan' element={<DeadpanPage />} />
        <Route path='games/hgt' element={<HgtPage />} />
        <Route path='news' element={<ReservedPage key='news' page='news' />} />
        <Route path='about' element={<ReservedPage key='about' page='about' />} />
        <Route path='contact' element={<ReservedPage key='contact' page='contact' />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Route>
    </Routes>
  )
}
