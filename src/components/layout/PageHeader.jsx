export default function PageHeader({ titulo, subtitulo, acciones, children }) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">{titulo}</h1>
        {subtitulo && <p className="page-header__subtitle">{subtitulo}</p>}
        {children}
      </div>
      {acciones && <div className="page-header__actions">{acciones}</div>}
    </div>
  )
}
