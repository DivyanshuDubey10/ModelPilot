import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/layout.css'
import App from './App.tsx'
import './styles/wizard.css'
import './styles/experiment.css'
import './styles/report.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
