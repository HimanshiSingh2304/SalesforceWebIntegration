import React from 'react'
import Styles from './header.module.css'
import Logo from '../../assets/logo.png'

const Header = () => {
  return (
    <div className={Styles.box}>
        <img src={Logo} alt="logo" className={Styles.logo}/> 
        <h2 className={Styles.text}>Salesforce Web Integration App</h2>

     
      
    </div>
  )
}

export default Header
