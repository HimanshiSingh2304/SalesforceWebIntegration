import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Main from './Pages/Home/Main.jsx'
import CallbackHandler from './Components/CallbackHandlerSection/CallbackHandler.jsx'
import Dashboard from './Pages/Dashboard/Dashboard.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Main/>}/>
      <Route path="/callback" element={<CallbackHandler />} />
      <Route path="/dashboard" element={<Dashboard/>}/>
    
    

    </Routes>
    </BrowserRouter>

  </StrictMode>,
)
