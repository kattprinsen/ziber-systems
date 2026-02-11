import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ToolsPage } from './pages/ToolsPage/ToolsPage.tsx'
import { ErrorPage } from './pages/ErrorPage/ErrorPage.tsx'
import { UsersPage } from './pages/UsersPage/UsersPage.tsx'
import { UserDetailPage } from './pages/UserDetailPage/UserDetailPage.tsx'
import { Layout } from './components/layout'
import { StrictMode } from 'react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)