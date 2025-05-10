import React from 'react'
import Styles from './validationrule.module.css'
import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../assets/loading.gif'

const ValidationRule = () => {
    const navigate = useNavigate();
  const [objectName, setObjectName] = useState('');
  const [validationRules, setValidationRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchValidationRules = async (object) => {
    const accessToken = localStorage.getItem('sf_access_token');
    const instanceUrl = localStorage.getItem('sf_instance_url');

    if (!accessToken || !instanceUrl) {
      console.error('Missing Salesforce access credentials');
      return;
    }

    setLoading(true);
    setObjectName(object);

    try {
      const response = await fetch('https://salesforcewebintegration.onrender.com/auth/validationRules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, instanceUrl, objectName: object }),
      });

      const data = await response.json();
      setValidationRules(data);
    } catch (error) {
      console.error('Error fetching validation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId, currentActive) => {
    setActionLoading(true);
    const accessToken = localStorage.getItem('sf_access_token');
    const instanceUrl = localStorage.getItem('sf_instance_url');
    
    // Debug logging
    console.log('Toggle Rule Request:', {
      ruleId,
      currentActive,
      accessToken: accessToken ? 'Present' : 'Missing',
      instanceUrl: instanceUrl ? 'Present' : 'Missing'
    });

    try {
      const response = await fetch('https://salesforcewebintegration.onrender.com/auth/toggleValidationRule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          instanceUrl,
          ruleId,
          active: !currentActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server Error Response:', errorData);
        setMessage(`Failed to update rule: ${errorData.error || 'Unknown error'}`);
        return;
      }

      // Refresh the rules list
      fetchValidationRules(objectName);
      setMessage(`Rule ${currentActive ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      console.error('Error toggling rule:', error);
      setMessage('Error updating rule');
    } finally {
      setActionLoading(false);
    }
  };



  return (
    <div>
      {/* Buttons Section */}
      <div className={Styles.buttonGroup}>
        <button onClick={() => fetchValidationRules('Account')} className={Styles.blueButton}>Account</button>
        <button onClick={() => fetchValidationRules('Contact')} className={Styles.blueButton}>Contact</button>
        <button onClick={() => fetchValidationRules('Lead')} className={Styles.blueButton}>Lead</button>
      </div>

      {/* Loading */}
      {loading && <p className={Styles.para}><img src={Loading} alt="" className={Styles.loading} /> </p>}

      {/* Message Display */}
      {message && <p className={Styles.message}>{message}</p>}

      {/* Table */}
      {!loading && validationRules.length > 0 && (
        <table className={Styles.table}>
          <thead>
            <tr>
              <th>Validation Name</th>
              <th>Status</th>
              <th>Error Field</th>
              <th>Error Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {validationRules.map(rule => (
              <tr key={rule.Id}>
                <td>{rule.ValidationName}</td>
                <td>{rule.Active ? '✅' : '❌'}</td>
                <td>{rule.ErrorDisplayField || '-'}</td>
                <td>{rule.ErrorMessage}</td>
                <td>
                  <button
                    className={rule.Active ? Styles.redButton : Styles.greenButton}
                    onClick={() => toggleRule(rule.Id, rule.Active)}
                    disabled={actionLoading}
                  >
                    {rule.Active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* No rules found */}
      {!loading && objectName && validationRules.length === 0 && (
        <p className={Styles.para}>No validation rules found for {objectName}.</p>
      )}

    </div>
  );
};

export default ValidationRule;
