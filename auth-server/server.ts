import express from 'express';
import { Issuer } from 'openid-client';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();

// Get port from environment variable or default to 4000
const PORT = process.env.PORT || 4000;

// Update CORS to allow your Azure frontend domain
const allowedOrigins = [
  'http://localhost:8080',
  process.env.FRONTEND_URL || 'https://your-frontend-app.azurewebsites.net'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

const { CLIENT_ID, CLIENT_SECRET, TENANT_ID, REDIRECT_URI, JWT_SECRET } = process.env;

// JWT middleware
const verifyJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET!, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

// Admin middleware
const verifyAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Reports loader
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

// Save reports data
const saveReportsData = (data: any) => {
  try {
    const reportsPath = path.join(__dirname, 'reports-data.json');
    fs.writeFileSync(reportsPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving reports data:', error);
    return false;
  }
};

// In-memory user database
const userDatabase = [
  { email: 'name1@gmail.com', phone: '9991110001', department: 'IT', password: 'password123', isAdmin: false },
  { email: 'name2@gmail.com', phone: '9991110002', department: 'Sales', password: 'password123', isAdmin: false },
  { email: 'bhavya.khatri@gmail.com', phone: '9991110003', department: 'Finance', password: 'password123', isAdmin: false },
  { email: 'john.doe@company.com', phone: '9991110004', department: 'HR', password: 'password123', isAdmin: false },
  { email: 'sarah.wilson@company.com', phone: '9991110005', department: 'Marketing', password: 'password123', isAdmin: false },
  { email: 'mike.johnson@company.com', phone: '9991110006', department: 'Operations', password: 'password123', isAdmin: false },
  { email: 'Bhavya@samunnati.com', phone: '9991110007', department: 'Data and BI', password: 'Welcome@1234', isAdmin: false },
  { email: 'admin@samunnati.com', phone: '', department: 'Admin', password: 'admin123', isAdmin: true }
];

// 🟩 Protected endpoint
app.get('/api/reports/:department', verifyJWT, (req: any, res: any) => {
  try {
    const department = decodeURIComponent(req.params.department);
    const userDepartment = req.user.department;
    const isAdmin = req.user.isAdmin;

    if (!isAdmin && department !== userDepartment) {
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

// 🟩 Admin endpoint to get all reports data
app.get('/api/admin/reports', verifyJWT, verifyAdmin, (req: any, res: any) => {
  try {
    const reportsData = loadReportsData();
    res.json(reportsData);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports data' });
  }
});

// 🟩 Admin endpoint to update reports data
app.put('/api/admin/reports', verifyJWT, verifyAdmin, (req: any, res: any) => {
  try {
    const { reportsData } = req.body;
    const success = saveReportsData(reportsData);
    
    if (success) {
      res.json({ message: 'Reports data updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save reports data' });
    }
  } catch (error) {
    console.error('Error updating reports data:', error);
    res.status(500).json({ error: 'Failed to update reports data' });
  }
});

// 🟩 Admin endpoint to update specific report
app.put('/api/admin/reports/:department/:reportId', verifyJWT, verifyAdmin, (req: any, res: any) => {
  try {
    const { department, reportId } = req.params;
    const updatedReport = req.body;
    
    const reportsData = loadReportsData();
    
    if (!reportsData[department]) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    const reportIndex = reportsData[department].findIndex((r: any) => r.id === reportId);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    reportsData[department][reportIndex] = { ...reportsData[department][reportIndex], ...updatedReport };
    
    const success = saveReportsData(reportsData);
    
    if (success) {
      res.json({ message: 'Report updated successfully', report: reportsData[department][reportIndex] });
    } else {
      res.status(500).json({ error: 'Failed to save report data' });
    }
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// 🟩 Admin endpoint to get user statistics
app.get('/api/admin/stats', verifyJWT, verifyAdmin, (req: any, res: any) => {
  try {
    const totalUsers = userDatabase.length;
    const reportsData = loadReportsData();
    
    let totalReports = 0;
    let activeReports = 0;
    
    Object.values(reportsData).forEach((departmentReports: any) => {
      totalReports += departmentReports.length;
      activeReports += departmentReports.filter((report: any) => report.isActive).length;
    });
    
    res.json({
      totalUsers,
      totalReports,
      activeReports
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// 🟩 Microsoft SSO URL
app.get('/auth/login-url', async (req, res) => {
  const issuer = await Issuer.discover(
    `https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`
  );
  const client = new issuer.Client({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    redirect_uris: [REDIRECT_URI!],
    response_types: ['code'],
  });

  const url = client.authorizationUrl({
    scope: 'openid profile email User.Read',
  });

  res.json({ url });
});

// 🟩 SSO Callback - Update redirect URL for production
app.get('/auth/callback', async (req, res) => {
  try {
    const issuer = await Issuer.discover(
      `https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`
    );
    const client = new issuer.Client({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      redirect_uris: [REDIRECT_URI!],
      response_types: ['code'],
    });

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(REDIRECT_URI!, params);
    const accessToken = tokenSet.access_token!;

    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,displayName,department', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const graphUser = await graphRes.json();

    const email = (graphUser.mail || graphUser.userPrincipalName || '').toLowerCase();
    const name = graphUser.displayName || 'User';

    const departmentMap: Record<string, string> = {
      'bhavya@samunnati.com': 'Finance',
      'john.doe@company.com': 'HR',
      'name1@gmail.com': 'Finance',
      'name2@gmail.com': 'Sales',
      'sarah.wilson@company.com': 'Marketing',
      'mike.johnson@company.com': 'Operations',
    };

    const department = graphUser.department || departmentMap[email] || 'IT';

    const jwtToken = jwt.sign(
      { email, department, name, isAdmin: false },
      JWT_SECRET!,
      { expiresIn: '2h' }
    );

    // Use environment variable for frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const redirectUrl = `${frontendUrl}?token=${jwtToken}`;
    res.redirect(redirectUrl);

  } catch (err) {
    console.error('❌ Auth callback error:', err);
    res.status(500).send('Authentication failed.');
  }
});

// 🟩 Manual login (email or phone)
app.post('/auth/manual-login', (req, res) => {
  const { email, phone, password } = req.body;

  const identifier = (email || phone || '').toLowerCase();

  const user = userDatabase.find(
    u =>
      (u.email.toLowerCase() === identifier || u.phone === identifier) &&
      u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

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
