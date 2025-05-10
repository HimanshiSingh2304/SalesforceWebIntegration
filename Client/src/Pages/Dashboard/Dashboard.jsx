import React, { useEffect, useState } from 'react';
import Header from '../../Components/HeaderSection/Header.jsx';
import Styles from './dashboard.module.css';
import Hero from '../../Components/HeroSection/Hero.jsx';
import ValidationRule from '../../Components/ValidationRuleSection/ValidationRule.jsx';
import LogOut from '../../Components/Logout/LogOut.jsx';
import Loading from '../../assets/loading.gif';

const Dashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing dashboard...');
  const [error, setError] = useState(null);

  const fetchUserInfo = async () => {
    const accessToken = localStorage.getItem('sf_access_token');
    const instanceUrl = localStorage.getItem('sf_instance_url');

    if (!accessToken || !instanceUrl) {
      setError('No access token or instance URL found. Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoadingStatus('Fetching user information...');
      const response = await fetch('http://localhost:4000/auth/userinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, instanceUrl }),
      });

      if (!response.ok) throw new Error('Failed to fetch user info');

      const userInfoData = await response.json();
      setUserInfo(userInfoData);

      if (userInfoData.organization_id) {
        setLoadingStatus('Loading organization details...');
        const orgResponse = await fetch('http://localhost:4000/auth/organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken,
            instanceUrl,
            organizationId: userInfoData.organization_id,
          }),
        });

        if (!orgResponse.ok) throw new Error('Failed to fetch organization info');
        const orgData = await orgResponse.json();
        setCompanyName(orgData.Name);
      }

      if (userInfoData.user_id) {
        setLoadingStatus('Getting Salesforce username...');
        const usernameResponse = await fetch('http://localhost:4000/auth/username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken,
            instanceUrl,
            userId: userInfoData.user_id,
          }),
        });

        if (!usernameResponse.ok) throw new Error('Failed to fetch username');
        const usernameData = await usernameResponse.json();
        setUsername(usernameData.username);
      }

      setLoadingStatus('Almost ready...');
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code && !sessionStorage.getItem('code_used')) {
        try {
          sessionStorage.setItem('code_used', 'true');
          setLoadingStatus('Exchanging authorization code...');

          const response = await fetch('http://localhost:4000/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();
          if (!response.ok || !data.access_token) {
            throw new Error(data.error || 'Failed to authenticate');
          }

          localStorage.setItem('sf_access_token', data.access_token);
          localStorage.setItem('sf_instance_url', data.instance_url);

          setLoadingStatus('Authentication successful! Fetching dashboard...');
          await fetchUserInfo();
        } catch (err) {
          console.error('Callback error:', err);
          setError(err.message);
          setLoading(false);
        }
      } else {
        fetchUserInfo();
      }
    };

    handleCallback();
  }, []);

  if (loading) {
    return (
      <div className={Styles.loadingContainer}>
        <div className={Styles.loadingContent}>
          <img src={Loading} alt="Loading" className={Styles.loadingImage} />
          <div className={Styles.loadingStatus}>{loadingStatus}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={Styles.errorContainer}>
        <div className={Styles.errorContent}>
          <div className={Styles.errorMessage}>{error}</div>
          <button className={Styles.retryButton} onClick={() => window.location.href = '/'}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <Hero />
      <div className={Styles.dashboardContent}>
        <h2 className={Styles.h2}>Welcome, {userInfo?.name.split(' ')[0]} 👋</h2>
        <div className={Styles.info}>
          <p><strong>Salesforce Username:</strong> {username}</p>
          <p><strong>Company:</strong> {companyName}</p>
        </div>
        <LogOut />
        <ValidationRule />
      </div>
    </div>
  );
};

export default Dashboard;
