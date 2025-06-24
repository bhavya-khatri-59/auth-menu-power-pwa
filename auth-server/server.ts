import express from 'express';
import { Issuer } from 'openid-client';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));

app.use(express.json());

const { CLIENT_ID, CLIENT_SECRET, TENANT_ID, REDIRECT_URI, JWT_SECRET } = process.env;

// Load reports data
const loadReportsData = () => {
  try {
    const reportsPath = path.join(__dirname, 'reports-data.json');
    const reportsData = fs.readFileSync(reportsPath, 'utf8');
    return JSON.parse(reportsData);
  } catch (error) {
    console.error('Error loading reports data:', error);
    return {};
  }
};

(async () => {
  const issuer = await Issuer.discover(
    `https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`
  );

  const client = new issuer.Client({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    redirect_uris: [REDIRECT_URI!],
    response_types: ['code'],
  });

  // Reports API endpoint
  app.get('/api/reports/:department', (req, res) => {
    try {
      const department = decodeURIComponent(req.params.department);
      const reportsData = loadReportsData();
      const departmentReports = reportsData[department] || [];
      
      console.log(`📊 Fetching reports for department: ${department}`);
      res.json({ reports: departmentReports });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  // Step 1: Get Microsoft login URL
  app.get('/auth/login-url', (req, res) => {
    const url = client.authorizationUrl({
      scope: 'openid profile email User.Read',
    });
    res.json({ url });
  });

  // Step 2: Handle Microsoft redirect
  app.get('/auth/callback', async (req, res) => {
    try {
      const params = client.callbackParams(req);
      const tokenSet = await client.callback(REDIRECT_URI!, params);
      const accessToken = tokenSet.access_token!;

      // Step 3: Call Microsoft Graph API to fetch user details
      const graphRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,displayName,department', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const graphUser = await graphRes.json();
      console.log('🎯 Microsoft Graph user:', graphUser);

      const email = (graphUser.mail || graphUser.userPrincipalName || '').toLowerCase();
      const name = graphUser.displayName || 'User';

      // Fallback map if department is missing from Graph
      const departmentMap: Record<string, string> = {
        'bhavya@samunnati.com': 'Finance',
        'john.doe@company.com': 'HR',
        'name1@gmail.com': 'Finance',
        'name2@gmail.com': 'Sales',
        'sarah.wilson@company.com': 'Marketing',
        'mike.johnson@company.com': 'Operations',
      };

      const department = graphUser.department || departmentMap[email] || 'IT';

      // Step 4: Generate signed JWT
      const jwtToken = jwt.sign(
        { email, department, name },
        JWT_SECRET!,
        { expiresIn: '2h' }
      );

      // Step 5: Redirect with token only (no sensitive query params)
      const redirectUrl = `http://localhost:8080?token=${jwtToken}`;
      res.redirect(redirectUrl);

    } catch (err) {
      console.error('❌ Auth callback error:', err);
      res.status(500).send('Authentication failed.');
    }
  });

  app.listen(4000, () => {
    console.log('✅ Auth server running at http://localhost:4000');
  });
})();
