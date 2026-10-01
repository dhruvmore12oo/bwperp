const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const salesOrdersRoutes = require('./routes/salesOrders');
const purchaseOrdersRoutes = require('./routes/purchaseOrders');
const inventoryRoutes = require('./routes/inventory');
const manufacturingRoutes = require('./routes/manufacturing');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. CORS Configuration
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Request Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Express Session Middleware (Session-cookie based auth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'flowline_brightweld_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevent client-side JS access to cookie
    secure: process.env.NODE_ENV === 'production', // Secure in production (HTTPS)
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales-orders', salesOrdersRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/manufacturing-jobs', manufacturingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);

// 5. Root Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Flowline ERP API' });
});

// 6. 404 Route Not Found Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// 7. Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: "Internal server error" });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Flowline ERP Backend Server Running           `);
  console.log(` Port: http://localhost:${PORT}                 `);
  console.log(` Allowed Frontend Origin: ${frontendOrigin} `);
  console.log(`===============================================`);
});
