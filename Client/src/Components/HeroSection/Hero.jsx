import React from 'react'
import Styles from './hero.module.css'

const Hero = () => {
  return (
    <div className={Styles.hero}>
      
    <h1 className={Styles.heading}>Salesforce Web Integration </h1>
    <p className={Styles.para}>
      This tool provides an interface to easily enable and disable components in your Salesforce Org - Workflows, Triggers and Validation Rules. Very useful when doing data migrations and needing to disable certain automation.
      None of your organisation information or data is captured or kept from running this tool.
    </p>
    </div>
  )
}

export default Hero
