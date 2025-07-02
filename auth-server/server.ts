
import express, { Request, Response, NextFunction } from 'express';
import { Issuer } from 'openid-client';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  'http://localhost:8080',
  process.env.FRONTEND_URL || 'https://your-frontend-app.azurewebsites.net',
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const { CLIENT_ID, CLIENT_SECRET, TENANT_ID, REDIRECT_URI, JWT_SECRET } = process.env;

interface JwtPayload {
  email: string;
  department: string;
  isAdmin: boolean;
  name?: string;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

type Report = {
  id: string;
  name: string;
  isActive: boolean;
  [key: string]: any;
};

type ReportsData = Record<string, Report[]>;

const loadReportsData = (): ReportsData => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'reports-data.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading reports:', error);
    return {};
  }
};

const saveReportsData = (data: ReportsData): boolean => {
  try {
    fs.writeFileSync(path.join(__dirname, 'reports-data.json'), JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving reports:', error);
    return false;
  }
};

const userDatabase = [
  { email: 'admin@samunnati.com', phone: '', department: 'Admin', password: 'admin123', isAdmin: true },
  { email: 'bhavya.khatri@gmail.com', phone: '9991110003', department: 'Finance', password: 'password123', isAdmin: false },
];

const verifyJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, JWT_SECRET!, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded as JwtPayload;
    next();
  });
};

const verifyAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
};

// Generate PowerBI embed token and URL
const generatePowerBIEmbed = async (reportId: string, datasetId: string, coreDatasetId: string) => {
  const { POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET, POWERBI_TENANT_ID, POWERBI_GROUP_ID } = process.env;
  
  if (!POWERBI_CLIENT_ID || !POWERBI_CLIENT_SECRET || !POWERBI_TENANT_ID || !POWERBI_GROUP_ID) {
    throw new Error('Missing PowerBI environment variables');
  }

  const authority = `https://login.microsoftonline.com/${POWERBI_TENANT_ID}`;
  const scope = 'https://analysis.windows.net/powerbi/api/.default';
  
  // Get access token
  const tokenUrl = `${authority}/oauth2/v2.0/token`;
  const tokenParams = new URLSearchParams({
    client_id: POWERBI_CLIENT_ID,
    client_secret: POWERBI_CLIENT_SECRET,
    scope: scope,
    grant_type: 'client_credentials'
  });

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token request failed: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Generate embed token
  const embedTokenPayload = {
  datasets: [
    { id: datasetId, xmlaPermissions: "ReadOnly" },
    { id: coreDatasetId, xmlaPermissions: "ReadOnly" }
  ],
  reports: [{ id: reportId }],
  targetWorkspaces: [{ id: POWERBI_GROUP_ID }],
  identities: [
    {
      username: 'saineeraj.kumar@samunnati.com',
      roles: ['RM'],
      datasets: [coreDatasetId]
    }
  ]
};


  const embedTokenResponse = await fetch('https://api.powerbi.com/v1.0/myorg/GenerateToken', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(embedTokenPayload)
  });

  if (!embedTokenResponse.ok) {
    throw new Error(`Embed token generation failed: ${embedTokenResponse.statusText}`);
  }

  const embedTokenData = await embedTokenResponse.json();
  const embedToken = embedTokenData.token;

  // Get embed URL
  const reportResponse = await fetch(`https://api.powerbi.com/v1.0/myorg/groups/${POWERBI_GROUP_ID}/reports/${reportId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!reportResponse.ok) {
    throw new Error(`Report details fetch failed: ${reportResponse.statusText}`);
  }

  const reportData = await reportResponse.json();
  const embedUrl = reportData.embedUrl;

  return { embedToken, embedUrl };
};

// 🆕 NEW ROUTE: Generate embed token and URL dynamically for any authenticated user
app.post('/api/reports/generate-embed', verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { reportId, datasetId, coreDatasetId } = req.body;
  
  if (!reportId || !datasetId || !coreDatasetId) {
    return res.status(400).json({ error: 'Missing embed parameters: reportId, datasetId, and coreDatasetId are required' });
  }

  try {
    const { embedToken, embedUrl } = await generatePowerBIEmbed(reportId, datasetId, coreDatasetId);
    return res.json({ embedToken, embedUrl });
  } catch (error) {
    console.error('Embed generation error:', error);
    return res.status(500).json({ error: 'Failed to generate embed token or URL' });
  }
});

// 📊 GET department reports - Updated to include PowerBI details for all users
app.get('/api/reports/:department', verifyJWT, (req: AuthenticatedRequest, res: Response) => {
  const department = decodeURIComponent(req.params.department);
  const { department: userDept, isAdmin } = req.user!;
  
  // Allow admins to access any department, non-admins only their own
  if (!isAdmin && department !== userDept) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const reports = loadReportsData();
  const departmentReports = reports[department] || [];

  // Filter active reports and include all PowerBI details for ALL users
  const filteredReports = departmentReports
    .filter(report => report.isActive !== false)
    .map(report => {
      const { id, title, description, icon, powerBIReportId, isActive, embedUrl, embedToken, reportId, clientId, tenantId, datasetId, coreDatasetId } = report;
      return { 
        id, 
        title, 
        description, 
        icon, 
        powerBIReportId, 
        isActive, 
        embedUrl, 
        embedToken, 
        reportId, 
        clientId, 
        tenantId,
        datasetId,
        coreDatasetId
      };
    });

  return res.json({ reports: filteredReports });
});

// 🔐 ADMIN - get all departments
app.get('/api/admin/departments', verifyJWT, verifyAdmin, (_req, res) => {
  const reportsData = loadReportsData();
  const departments = Object.keys(reportsData);
  return res.json({ departments });
});

// 🔐 ADMIN - add department
app.post('/api/admin/departments', verifyJWT, verifyAdmin, (req, res) => {
  const { departmentName } = req.body;
  if (!departmentName || typeof departmentName !== 'string') {
    return res.status(400).json({ error: 'Department name is required' });
  }

  const reportsData = loadReportsData();
  if (reportsData[departmentName]) {
    return res.status(400).json({ error: 'Department already exists' });
  }

  reportsData[departmentName] = [];
  const success = saveReportsData(reportsData);
  
  return success 
    ? res.json({ message: 'Department added successfully' })
    : res.status(500).json({ error: 'Failed to save department' });
});

// 🔐 ADMIN - delete department
app.delete('/api/admin/departments/:departmentName', verifyJWT, verifyAdmin, (req, res) => {
  const { departmentName } = req.params;
  const reportsData = loadReportsData();
  
  if (!reportsData[departmentName]) {
    return res.status(404).json({ error: 'Department not found' });
  }

  delete reportsData[departmentName];
  const success = saveReportsData(reportsData);
  
  return success 
    ? res.json({ message: 'Department deleted successfully' })
    : res.status(500).json({ error: 'Failed to delete department' });
});

// 🔐 ADMIN - generate PowerBI embed details
app.post('/api/admin/generate-embed', verifyJWT, verifyAdmin, async (req, res) => {
  const { reportId, datasetId, coreDatasetId } = req.body;
  
  if (!reportId || !datasetId || !coreDatasetId) {
    return res.status(400).json({ error: 'Report ID, dataset ID, and core dataset ID are required' });
  }

  try {
    const { embedToken, embedUrl } = await generatePowerBIEmbed(reportId, datasetId, coreDatasetId);
    return res.json({ embedToken, embedUrl });
  } catch (error) {
    console.error('PowerBI embed generation error:', error);
    return res.status(500).json({ error: 'Failed to generate embed details' });
  }
});

// 🔐 ADMIN - get all
app.get('/api/admin/reports', verifyJWT, verifyAdmin, (_req, res) => {
  return res.json(loadReportsData());
});

app.get('/api/admin/all-reports', verifyJWT, verifyAdmin, (_req, res) => {
  const reportsData = loadReportsData();
  const allReports = Object.entries(reportsData).flatMap(([dept, reports]) =>
    reports.map(r => ({ ...r, department: dept }))
  );
  console.log('Sending all reports:', { reports: allReports });
  return res.json({ reports: allReports });
});

// 🔄 ADMIN - update entire dataset
app.put('/api/admin/reports', verifyJWT, verifyAdmin, (req, res) => {
  const success = saveReportsData(req.body.reportsData);
  return success ? res.json({ message: 'Saved' }) : res.status(500).json({ error: 'Save failed' });
});

// 🔄 ADMIN - update single report
app.put('/api/admin/reports/:department/:reportId', verifyJWT, verifyAdmin, (req, res) => {
  const { department, reportId } = req.params;
  const newData: Report = req.body;
  const data = loadReportsData();

  if (!data[department]) return res.status(404).json({ error: 'Department not found' });

  const index = data[department].findIndex(r => r.id === reportId);
  if (index === -1) return res.status(404).json({ error: 'Report not found' });

  data[department][index] = { ...data[department][index], ...newData };
  return saveReportsData(data)
    ? res.json({ message: 'Updated', report: data[department][index] })
    : res.status(500).json({ error: 'Save failed' });
});

// 📊 Admin stats
app.get('/api/admin/stats', verifyJWT, verifyAdmin, (_req, res) => {
  const reports = loadReportsData();
  const totalReports = Object.values(reports).reduce((acc, r) => acc + r.length, 0);
  const activeReports = Object.values(reports).reduce(
    (acc, r) => acc + r.filter(x => x.isActive).length,
    0
  );
  res.json({ totalUsers: userDatabase.length, totalReports, activeReports });
});

// 🔑 SSO login URL
app.get('/auth/login-url', async (_req, res) => {
  const issuer = await Issuer.discover(`https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`);
  const client = new issuer.Client({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    redirect_uris: [REDIRECT_URI!],
    response_types: ['code'],
  });

  const url = client.authorizationUrl({ scope: 'openid profile email User.Read' });
  res.json({ url });
});

// 🔁 SSO callback
app.get('/auth/callback', async (req, res) => {
  try {
    const issuer = await Issuer.discover(`https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`);
    const client = new issuer.Client({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      redirect_uris: [REDIRECT_URI!],
      response_types: ['code'],
    });

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(REDIRECT_URI!, params);
    const graphUser = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,displayName,department', {
      headers: { Authorization: `Bearer ${tokenSet.access_token}` },
    }).then(res => res.json());

    const email = (graphUser.mail || graphUser.userPrincipalName || '').toLowerCase();
    const department = graphUser.department || 'IT';

    const jwtToken = jwt.sign(
      { email, department, name: graphUser.displayName || 'User', isAdmin: false },
      JWT_SECRET!,
      { expiresIn: '2h' }
    );

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}?token=${jwtToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('SSO Error:', error);
    res.status(500).send('Authentication failed.');
  }
});

// 🔐 Manual login
app.post('/auth/manual-login', (req, res) => {
  const { email, phone, password } = req.body;
  const identifier = (email || phone || '').toLowerCase();

  const user = userDatabase.find(
    u => (u.email.toLowerCase() === identifier || u.phone === identifier) && u.password === password
  );

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { email: user.email, department: user.department, isAdmin: user.isAdmin || false },
    JWT_SECRET!,
    { expiresIn: '2h' }
  );

  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`✅ Auth server running at http://localhost:${PORT}`);
});
