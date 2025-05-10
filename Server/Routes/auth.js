import express from 'express';
import fetch from 'node-fetch';


const router = express.Router();

// Route 1: Exchange Code for Token
router.post('/token', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', process.env.SALESFORCE_CLIENT_ID);
  params.append('client_secret', process.env.SALESFORCE_CLIENT_SECRET);
  params.append('redirect_uri', process.env.SALESFORCE_REDIRECT_URI);
  params.append('code', code);

  try {
    console.log('Exchanging code for token...');
    console.log('Authorization code:', code);
    console.log('Redirect URI:', process.env.SALESFORCE_REDIRECT_URI);

    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Salesforce token error:', data);
      return res.status(400).json(data); // Forward Salesforce error to frontend
    }

    console.log('Salesforce token received successfully');
    res.json(data);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
});
// Route 2: Fetch User Info
router.post('/userinfo', async (req, res) => {
  const { accessToken, instanceUrl } = req.body;

  try {
    const userInfoResponse = await fetch(`${instanceUrl}/services/oauth2/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userInfo = await userInfoResponse.json();
    res.json(userInfo);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// Route 3: Fetch Organization (Company) Info
router.post('/organization', async (req, res) => {
  const { accessToken, instanceUrl, organizationId } = req.body;

  try {
    const orgResponse = await fetch(`${instanceUrl}/services/data/v60.0/sobjects/Organization/${organizationId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const orgData = await orgResponse.json();
    res.json(orgData);
  } catch (error) {
    console.error('Error fetching organization info:', error);
    res.status(500).json({ error: 'Failed to fetch organization info' });
  }
});

// Route 4: Fetch Salesforce Username
router.post('/username', async (req, res) => {
  const { accessToken, instanceUrl, userId } = req.body;

  try {
    const userResponse = await fetch(`${instanceUrl}/services/data/v60.0/sobjects/User/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const userData = await userResponse.json();
    res.json({ username: userData.Username });
  } catch (error) {
    console.error('Error fetching username:', error);
    res.status(500).json({ error: 'Failed to fetch username' });
  }
});
// Route 5: Fetch Validation rules
router.post('/validationRules', async (req, res) => {
  const { accessToken, instanceUrl, objectName } = req.body;

  if (!accessToken || !instanceUrl || !objectName) {
    return res.status(400).json({ error: 'Missing required fields: accessToken, instanceUrl, objectName' });
  }

  try {
    const query = `
      SELECT Id, Active, Description, ErrorDisplayField, ErrorMessage, ValidationName
      FROM ValidationRule
      WHERE EntityDefinition.QualifiedApiName = '${objectName}'
    `;

    const response = await fetch(`${instanceUrl}/services/data/v60.0/tooling/query?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.records) {
      res.json(data.records); // only send records
    } else {
      res.status(400).json({ error: 'No validation rules found', details: data });
    }
  } catch (error) {
    console.error('Error fetching validation rules:', error);
    res.status(500).json({ error: 'Failed to fetch validation rules' });
  }
});

//
router.post('/toggleAllValidationRules', async (req, res) => {
  const { accessToken, instanceUrl, objectName, active } = req.body;

  const query = `SELECT Id FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = '${objectName}'`;
  const fetchUrl = `${instanceUrl}/services/data/v60.0/tooling/query?q=${encodeURIComponent(query)}`;

  const fetchResponse = await fetch(fetchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const fetchData = await fetchResponse.json();

  const results = await Promise.all(
    fetchData.records.map(async (rule) => {
      const updateUrl = `${instanceUrl}/services/data/v60.0/tooling/sobjects/ValidationRule/${rule.Id}`;
      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Active: active }), // Correct field
      });
      return response.ok;
    })
  );

  res.json({ success: true, updated: results.filter(Boolean).length });
});

// Route 6: Toggle Individual Validation Rule
router.post('/toggleValidationRule', async (req, res) => {
  const { accessToken, instanceUrl, ruleId, active } = req.body;

  // Debug logging
  console.log('Received toggle request:', {
    hasAccessToken: !!accessToken,
    hasInstanceUrl: !!instanceUrl,
    ruleId,
    active
  });

  // Validate required fields
  const missingFields = [];
  if (!accessToken) missingFields.push('accessToken');
  if (!instanceUrl) missingFields.push('instanceUrl');
  if (!ruleId) missingFields.push('ruleId');
  if (active === undefined) missingFields.push('active');

  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    return res.status(400).json({ 
      error: 'Missing required fields',
      missingFields,
      received: {
        hasAccessToken: !!accessToken,
        hasInstanceUrl: !!instanceUrl,
        hasRuleId: !!ruleId,
        active
      }
    });
  }

  try {
    // First, fetch the rule's metadata
    const metadataUrl = `${instanceUrl}/services/data/v60.0/tooling/sobjects/ValidationRule/${ruleId}`;
    console.log('Fetching rule metadata:', metadataUrl);
    
    const metadataResponse = await fetch(metadataUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json();
      console.error('Error fetching rule metadata:', errorData);
      return res.status(metadataResponse.status).json({ 
        error: 'Failed to fetch validation rule metadata',
        details: errorData
      });
    }

    const ruleMetadata = await metadataResponse.json();
    console.log('Retrieved rule metadata:', ruleMetadata);

    // Now update the rule with all required fields
    const updateUrl = `${instanceUrl}/services/data/v60.0/tooling/sobjects/ValidationRule/${ruleId}`;
    console.log('Making update request to Salesforce:', updateUrl);
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Metadata: {
          active: active,
          errorConditionFormula: ruleMetadata.Metadata.errorConditionFormula,
          errorMessage: ruleMetadata.Metadata.errorMessage,
          errorDisplayField: ruleMetadata.Metadata.errorDisplayField || null,
          description: ruleMetadata.Metadata.description || null
        }
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Salesforce API Error:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        error: errorData,
        requestBody: {
          Metadata: {
            active: active,
            errorConditionFormula: ruleMetadata.Metadata.errorConditionFormula,
            errorMessage: ruleMetadata.Metadata.errorMessage,
            errorDisplayField: ruleMetadata.Metadata.errorDisplayField || null,
            description: ruleMetadata.Metadata.description || null
          }
        }
      });
      return res.status(updateResponse.status).json({ 
        error: 'Failed to update validation rule',
        details: errorData,
        salesforceStatus: updateResponse.status
      });
    }

    res.json({ success: true, message: `Validation rule ${active ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    console.error('Error toggling validation rule:', error);
    res.status(500).json({ 
      error: 'Failed to update validation rule',
      details: error.message
    });
  }
});





export default router;
