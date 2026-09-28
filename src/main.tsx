import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Richiedi from './pages/Richiedi'
import Verifica from './pages/Verifica'
import Login from './pages/Login'
import Pipeline from './pages/Pipeline'
import Strutture from './pages/Strutture'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/richiedi" element={<Richiedi />} />
        <Route path="/verifica" element={<Verifica />} />
        <Route path="/staff/login" element={<Login />} />
        <Route path="/staff/pipeline" element={<Pipeline />} />
        <Route path="/staff/strutture" element={<Strutture />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
