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

// 📊 GET department reports
app.get('/api/reports/:department', verifyJWT, (req: AuthenticatedRequest, res: Response) => {
  const department = decodeURIComponent(req.params.department);
  const { department: userDept, isAdmin } = req.user!;
  if (!isAdmin && department !== userDept) return res.status(403).json({ error: 'Access denied' });

  const reports = loadReportsData();
  return res.json({ reports: reports[department] || [] });
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
