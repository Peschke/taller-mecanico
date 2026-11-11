import { useMemo } from 'react'
import { useAuth } from '@/hooks/core/useAuth'
import { useCatalogos } from '@/hooks/core/useCatalogos'
import { transicionesComoBotones } from '@/lib/constants/transiciones'

// Botones de estado permitidos para el rol actual según transiciones_estado (RNF04)
export function useTransicionesDisponibles(estado) {
  const { rol } = useAuth()
  const { getTransiciones } = useCatalogos()
  return useMemo(() => (estado ? transicionesComoBotones(getTransiciones(estado, rol), estado) : []), [estado, rol, getTransiciones])
}
