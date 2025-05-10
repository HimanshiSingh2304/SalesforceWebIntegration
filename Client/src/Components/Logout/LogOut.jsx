import React from 'react'
import { useNavigate } from 'react-router-dom'
import Styles from './logout.module.css'

const LogOut = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Clear all authentication-related data
    localStorage.removeItem('sf_access_token')
    localStorage.removeItem('sf_instance_url')
    sessionStorage.removeItem('code_used')

    // Navigate to home page
    navigate('/')
  }

  return (
    <div >
        <button onClick={handleLogout} className={Styles.logout}>Logout</button>
        </div>
  )
}

export default LogOut
