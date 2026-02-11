import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ToolsPage } from './pages/ToolsPage/ToolsPage.tsx'
import { ErrorPage } from './pages/ErrorPage/ErrorPage.tsx'
import { StrictMode } from 'react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="*" element={<ErrorPage />} />
        <Route path="/tools" element={<ToolsPage />} />
      </Routes>
    </BrowserRouter>,
  </StrictMode>
)