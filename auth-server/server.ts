import express from 'express';
import { Issuer } from 'openid-client';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'; 

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
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

  // Step 1: Frontend requests Microsoft login URL
  app.get('/auth/login-url', (req, res) => {
    const url = client.authorizationUrl({
      scope: 'openid profile email',
    });
    res.json({ url });
  });

  // Step 2: Microsoft redirects here after SSO
  app.get('/auth/callback', async (req, res) => {
    try {
      const params = client.callbackParams(req);
      const tokenSet = await client.callback(REDIRECT_URI!, params);
      const accessToken = tokenSet.access_token!;

      // Fetch user details from Graph API
      const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const graphUser = await graphRes.json();
      console.log('🎯 Microsoft Graph user:', graphUser);

      // Get email and name
      const email = graphUser.mail || graphUser.userPrincipalName || 'unknown@example.com';
      const name = graphUser.displayName || graphUser.givenName || 'User';

      // Map to department
      const departmentMap: Record<string, string> = {
        'bhavya@samunnati.com': 'Finance',
      };

      const department = departmentMap[email.toLowerCase()] || 'IT';

      // ✅ Sign JWT token
      const jwtToken = jwt.sign(
        { email, department },
        JWT_SECRET!,
        { expiresIn: '2h' }
      );

      // ✅ Redirect to frontend with token
      const redirectUrl = `http://localhost:8080?token=${jwtToken}`;
      res.redirect(redirectUrl);

    } catch (err) {
      console.error('❌ Auth callback error:', err);
      res.status(500).send('Authentication failed. Check console for details.');
    }
  });

  app.listen(4000, () => {
    console.log('✅ Auth server running at http://localhost:4000');
  });
})();
