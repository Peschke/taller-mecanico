import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles/variables.css'
import './styles/reset.css'
import './styles/global.css'
import './styles/themes/admin.css'
import './styles/themes/mecanico.css'
import './styles/themes/cliente.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
