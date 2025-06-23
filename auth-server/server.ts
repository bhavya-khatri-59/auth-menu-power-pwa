
import express from 'express';
import { Issuer } from 'openid-client';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));

const { CLIENT_ID, CLIENT_SECRET, TENANT_ID, REDIRECT_URI, JWT_SECRET } = process.env;

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
