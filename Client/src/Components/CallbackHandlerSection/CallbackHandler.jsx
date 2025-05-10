import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../assets/loading.gif';
import Styles from './callbackhandler.module.css';

const CallbackHandler = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Initializing authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setError('No authorization code received');
      return;
    }

    if (sessionStorage.getItem('code_used')) {
      setStatus('Authentication already in progress...');
      return;
    }

    const authenticate = async () => {
      try {
        setStatus('Exchanging authorization code...');
        sessionStorage.setItem('code_used', 'true');

        const response = await fetch('http://localhost:4000/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to authenticate');
        }

        if (data.access_token) {
          setStatus('Storing credentials...');
          localStorage.setItem('sf_access_token', data.access_token);
          localStorage.setItem('sf_instance_url', data.instance_url);
          
          setStatus('Authentication successful! Redirecting...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          throw new Error('No access token received');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err.message);
        setStatus('Authentication failed');
      }
    };

    authenticate();
  }, [navigate]);

  return (
    <div className={Styles.container}>
      <div className={Styles.loadingContainer}>
        <img src={Loading} alt="Loading" className={Styles.loadingImage} />
        <div className={Styles.statusText}>{status}</div>
        {error && (
          <div className={Styles.errorText}>
            Error: {error}
            <button 
              className={Styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallbackHandler;
