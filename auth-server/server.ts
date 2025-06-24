
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

// JWT verification middleware
const verifyJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Load reports data
const loadReportsData = () => {
  try {
    const reportsPath = path.join(__dirname, 'reports-data.json');
    console.log('Loading reports from:', reportsPath);
    const reportsData = fs.readFileSync(reportsPath, 'utf8');
    console.log('✅ Raw reports JSON:', reportsData);
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

  // Protected Reports API endpoint with JWT verification
  app.get('/api/reports/:department', verifyJWT, (req: any, res: any) => {
    try {
      const department = decodeURIComponent(req.params.department);
      const userDepartment = req.user.department;
      
      // Additional security: ensure user can only access their department's reports
      if (department !== userDepartment) {
        return res.status(403).json({ error: 'Access denied: Cannot access other department reports' });
      }
      
      const reportsData = loadReportsData();
      const departmentReports = reportsData[department] || [];
      
      console.log(`📊 Fetching reports for department: ${department} (user: ${req.user.email})`);
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
  // POST /auth/manual-login
app.post('/auth/manual-login', (req, res) => {
  const { email, password } = req.body;

  const userDatabase = [
    { email: 'name1@gmail.com', department: 'IT', password: 'password123' },
    { email: 'name2@gmail.com', department: 'Sales', password: 'password123' },
    { email: 'bhavya.khatri@gmail.com', department: 'Finance', password: 'password123' },
    { email: 'john.doe@company.com', department: 'HR', password: 'password123' },
    { email: 'sarah.wilson@company.com', department: 'Marketing', password: 'password123' },
    { email: 'mike.johnson@company.com', department: 'Operations', password: 'password123' },
    { email: 'Bhavya@samunnati.com', department: 'Data and BI', password: 'Welcome@1234' },
  ];

  const user = userDatabase.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { email: user.email, department: user.department },
    JWT_SECRET!,
    { expiresIn: '2h' }
  );

  res.json({ token });
});


  app.listen(4000, () => {
    console.log('✅ Auth server running at http://localhost:4000');
  });
})();
