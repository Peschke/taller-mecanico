import { useCallback, useRef, useState } from 'react'

/**
 * const { confirm, dialogProps } = useConfirm()
 * if (await confirm({ titulo, mensaje, confirmarTexto, peligro })) { ... }
 * <ConfirmDialog {...dialogProps} />
 */
export function useConfirm() {
  const [opts, setOpts] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(
    (o) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setOpts(o)
      }),
    [],
  )

  const cerrar = (valor) => {
    resolver.current?.(valor)
    resolver.current = null
    setOpts(null)
  }

  return {
    confirm,
    dialogProps: {
      open: Boolean(opts),
      titulo: opts?.titulo,
      mensaje: opts?.mensaje,
      confirmarTexto: opts?.confirmarTexto,
      peligro: opts?.peligro,
      onConfirm: () => cerrar(true),
      onCancel: () => cerrar(false),
    },
  }
}
