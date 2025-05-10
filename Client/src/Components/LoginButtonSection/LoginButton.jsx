import React from 'react';
import Styles from './loginbutton.module.css';

const LoginButton = () => {
  const clientId = import.meta.env.VITE_SALESFORCE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SALESFORCE_REDIRECT_URI;

  const loginWithSalesforce = () => {
    const authorizationUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=api%20refresh_token`;
    window.location.href = authorizationUrl;
    console.log('Client ID:', clientId);
    console.log('Redirect URI:', redirectUri);
  };

  return (
    <div className={Styles.buttonContainer}>
      <button onClick={loginWithSalesforce} className={Styles.loginButton}>
        Login
      </button>
    </div>
  );
};

export default LoginButton;
