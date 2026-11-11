// Íconos de trazo, sin dependencias. name: ver PATHS_ICONOS
const PATHS_ICONOS = {
  panel: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  ordenes: 'M7 4h10l3 3v13H4V4h3zM8 10h8M8 14h8M8 18h5',
  presupuesto: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  caja: 'M3 7h18v12H3zM3 11h18M7 15h3',
  inventario: 'M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10',
  compras: 'M4 5h2l2 11h10l2-8H7M10 20a1 1 0 1 0 0-.1M17 20a1 1 0 1 0 0-.1',
  reportes: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  registro: 'M12 5v14M5 12h14',
  clientes: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  notificar: 'M22 6l-10 7L2 6M2 6h20v12H2z',
  usuarios: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0',
  catalogos: 'M4 6h16M4 12h16M4 18h10',
  auditoria: 'M12 8v4l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  trabajos: 'M14.7 6.3a4 4 0 0 0 5 5L12 19l-4 1 1-4 7.7-7.7z',
  disponibles: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v8M8 12h8',
  solicitudes: 'M9 5H5v16h14V5h-4M9 3h6v4H9zM9 12h6M9 16h4',
  campana: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  salir: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  auto: 'M5 17h14M5 17a2 2 0 1 0 0 .1M19 17a2 2 0 1 0 0 .1M3 13l2-6h14l2 6v4H3z',
}

export default function Icon({ name, size = 20, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS_ICONOS[name] ?? PATHS_ICONOS.panel} />
    </svg>
  )
}
