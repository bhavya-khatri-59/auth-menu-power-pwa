import express from 'express';
import { Issuer } from 'openid-client';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));

const { CLIENT_ID, CLIENT_SECRET, TENANT_ID, REDIRECT_URI } = process.env;

interface UserInfo {
  email?: string;
  name?: string;
  [key: string]: any;
}

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

  // Step 1: Frontend calls this to get the Microsoft login URL
  app.get('/auth/login-url', (req, res) => {
    const url = client.authorizationUrl({
      scope: 'openid profile email',
    });
    res.json({ url });
  });

  // Step 2: Microsoft redirects here after user logs in
  app.get('/auth/callback', async (req, res) => {
    try {
      const params = client.callbackParams(req);
      const tokenSet = await client.callback(REDIRECT_URI!, params);
      const userInfo = await client.userinfo(tokenSet.access_token!) as UserInfo;

      let email = 'Bhavya@samunnati.com';
      let department = 'IT';

      if (typeof userInfo.email === 'string') {
        email = userInfo.email;

        const departmentMap: Record<string, string> = {
          'bhavya@samunnati.com': 'IT',
          'john.doe@company.com': 'HR',
          'name1@gmail.com': 'Finance',
          'name2@gmail.com': 'Sales',
          'sarah.wilson@company.com': 'Marketing',
          'mike.johnson@company.com': 'Operations',
        };

        department = departmentMap[email] || 'IT';
      }
      email = 'Bhavya@samunnati.com';
      department = 'IT';

      // Redirect to frontend with email and department as query params
      const redirectUrl = `http://localhost:8080?email=${encodeURIComponent(email)}&department=${encodeURIComponent(department)}`;
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
