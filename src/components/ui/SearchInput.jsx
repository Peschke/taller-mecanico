import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/core/useDebounce'

// Llama onSearch con debounce (RNF05). Controlado internamente.
export default function SearchInput({ onSearch, placeholder = 'Buscar…', delay = 300, label = 'Buscar', initial = '', ...rest }) {
  const [valor, setValor] = useState(initial)
  const debounced = useDebounce(valor, delay)

  useEffect(() => {
    onSearch?.(debounced.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <div className="search">
      <svg className="search__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        className="input search__input"
        aria-label={label}
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        {...rest}
      />
    </div>
  )
}
