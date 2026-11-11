// tabs: [{ value, label, badge? }]
export default function Tabs({ tabs, value, onChange, label = 'Secciones' }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          className={['tabs__tab', value === t.value && 'tabs__tab--active'].filter(Boolean).join(' ')}
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {t.badge != null && <span className="tabs__badge">{t.badge}</span>}
        </button>
      ))}
    </div>
  )
}
