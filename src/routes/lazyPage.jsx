import { Suspense, lazy } from 'react'
import SplashScreen from '@/components/layout/SplashScreen'

// Carga diferida de páginas: cada área se descarga solo cuando se usa
export function lazyPage(importer) {
  const Componente = lazy(importer)
  return (
    <Suspense fallback={<SplashScreen />}>
      <Componente />
    </Suspense>
  )
}
