import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Richiedi from './pages/Richiedi'
import Login from './pages/Login'
import Pipeline from './pages/Pipeline'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Richiedi />} />
        <Route path="/staff/login" element={<Login />} />
        <Route path="/staff/pipeline" element={<Pipeline />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
