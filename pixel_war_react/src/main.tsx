import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Grid from './frontend/grid/grid.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Grid w={100} h={100} />
  </StrictMode>,
)
