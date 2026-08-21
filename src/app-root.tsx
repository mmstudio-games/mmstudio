import { Navigate, Route, Routes } from 'react-router-dom'

import { SiteLayout } from '@/components/site-layout'
import { HomePage } from '@/pages/home-page'
import { ReservedPage } from '@/pages/reserved-page'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path='games/deadpan' element={<ReservedPage page='deadpan' />} />
        <Route path='news' element={<ReservedPage page='news' />} />
        <Route path='about' element={<ReservedPage page='about' />} />
        <Route path='contact' element={<ReservedPage page='contact' />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Route>
    </Routes>
  )
}
