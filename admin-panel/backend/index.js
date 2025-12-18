const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { KeyManagementServiceClient } = require('@google-cloud/kms');
const multer = require('multer');
const nodemailer = require('nodemailer');
const emailService = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy (required for Cloud Run and rate limiting)
app.set('trust proxy', true);

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'admin-panel-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Admin credentials (in production, store in environment variables)
// This is kept for backward compatibility during migration
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'tax@growwell.com',
  password: process.env.ADMIN_PASSWORD || '$2b$10$68GFNxsea9..K0Sadg5v/e20bFQostnl1iNJRpy9ry3DG6h7nGZvm', // password: "admin@Password123"
  name: 'Admin User',
  role: 'super_admin'
};

// Log admin credentials configuration (for debugging - remove password hash in production logs if needed)
console.log('🔐 Admin Credentials Configuration:');
console.log('  - Email:', ADMIN_CREDENTIALS.email);
console.log('  - Password hash:', ADMIN_CREDENTIALS.password);
console.log('  - Using env ADMIN_EMAIL:', !!process.env.ADMIN_EMAIL);
console.log('  - Using env ADMIN_PASSWORD:', !!process.env.ADMIN_PASSWORD);

// Permission definitions
const PERMISSIONS = {
  // Admin user management
  MANAGE_ADMINS: 'manage_admins',
  
  // User management
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Application management
  VIEW_APPLICATIONS: 'view_applications',
  EDIT_APPLICATIONS: 'edit_applications',
  DELETE_APPLICATIONS: 'delete_applications',
  
  // Payment management
  VIEW_PAYMENTS: 'view_payments',
  EDIT_PAYMENTS: 'edit_payments',
  
  // Appointment management
  VIEW_APPOINTMENTS: 'view_appointments',
  EDIT_APPOINTMENTS: 'edit_appointments',
  
  // Feedback management
  VIEW_FEEDBACK: 'view_feedback',
  EDIT_FEEDBACK: 'edit_feedback',
  
  // Support requests
  VIEW_SUPPORT: 'view_support',
  EDIT_SUPPORT: 'edit_support',
  
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
};

// Role definitions with permissions
const ROLES = {
  super_admin: [
    PERMISSIONS.MANAGE_ADMINS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.EDIT_APPLICATIONS,
    PERMISSIONS.DELETE_APPLICATIONS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.EDIT_PAYMENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.VIEW_FEEDBACK,
    PERMISSIONS.EDIT_FEEDBACK,
    PERMISSIONS.VIEW_SUPPORT,
    PERMISSIONS.EDIT_SUPPORT,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
  admin: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.EDIT_APPLICATIONS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.EDIT_PAYMENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.VIEW_FEEDBACK,
    PERMISSIONS.EDIT_FEEDBACK,
    PERMISSIONS.VIEW_SUPPORT,
    PERMISSIONS.EDIT_SUPPORT,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
  viewer: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.VIEW_FEEDBACK,
    PERMISSIONS.VIEW_SUPPORT,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
};

// Helper function to get permissions for a role
const getPermissionsForRole = (role) => {
  return ROLES[role] || [];
};

// Helper function to check if user has permission
const hasPermission = (userPermissions, permission) => {
  return userPermissions.includes(permission);
};

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');

// Initialize GCS/KMS Service Account (different from Firebase)
const gcsServiceAccount = require('./gcs-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tax-filing-app-3649f'
});

const db = admin.firestore();

// Initialize Google Cloud Storage
const storage = new Storage({ 
  projectId: 'tax-filing-app-3649f', 
  credentials: gcsServiceAccount 
});
const BUCKET_NAME = 'tax-filing-documents-tax-filing-app-3649f';
const bucket = storage.bucket(BUCKET_NAME);

// Initialize KMS
console.log('🔧 Initializing KMS Client...');
console.log('  - Service Account Project:', gcsServiceAccount.project_id);
console.log('  - Service Account Email:', gcsServiceAccount.client_email);
console.log('  - KMS Project ID:', 'tax-filing-app-3649f');

const kmsClient = new KeyManagementServiceClient({
  credentials: gcsServiceAccount,
  projectId: 'tax-filing-app-3649f'
});

console.log('✅ KMS Client initialized');

// Test KMS connection and permissions
const testKMSConnection = async () => {
  try {
    console.log('🧪 Testing KMS connection...');
    const name = `projects/${PROJECT_ID}/locations/${LOCATION_ID}/keyRings/${KEY_RING_ID}/cryptoKeys/${KEY_ID}`;
    
    // Try to get the key info first
    const [key] = await kmsClient.getCryptoKey({ name });
    console.log('✅ KMS Key found:', {
      name: key.name,
      purpose: key.purpose,
      state: key.primary?.state,
      algorithm: key.primary?.algorithm
    });
    
    // Try a small test encryption
    const testData = Buffer.from('test-encryption-data');
    console.log('🧪 Testing encryption with small data...');
    
    const [testEncryptResponse] = await kmsClient.encrypt({
      name: name,
      plaintext: testData
    });
    
    console.log('✅ Test encryption successful!');
    console.log('  - Original size:', testData.length);
    console.log('  - Encrypted size:', testEncryptResponse.ciphertext.length);
    
    return true;
  } catch (error) {
    console.error('❌ KMS Connection Test Failed:', error);
    console.error('❌ Error Code:', error.code);
    console.error('❌ Error Message:', error.message);
    console.error('❌ Error Details:', error.details);
    return false;
  }
};

// KMS Configuration
const PROJECT_ID = 'tax-filing-app-3649f';
const KEY_RING_ID = 'tax-filing-key-ring';
const KEY_ID = 'tax-filing-key';
const LOCATION_ID = 'global';


// DEK (Data Encryption Key) approach for large files
const crypto = require('crypto');

const encryptFileWithDEK = async (fileBuffer) => {
  try {
    console.log('🔐 Starting DEK encryption process...');
    console.log('  - File size:', fileBuffer.length, 'bytes');
    
    // Step 1: Generate a random 256-bit (32-byte) key for AES-256
    const dataKey = crypto.randomBytes(32);
    console.log('  - Generated DEK:', dataKey.length, 'bytes');
    
    // Step 2: Encrypt the file with AES-256-CBC using createCipheriv
    const iv = crypto.randomBytes(16); // 128-bit IV for CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', dataKey, iv);
    
    let encryptedData = cipher.update(fileBuffer);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);
    
    console.log('  - File encrypted with AES-256-CBC (createCipheriv)');
    console.log('  - Encrypted size:', encryptedData.length, 'bytes');
    
    // Step 3: Encrypt the data key with KMS
    console.log('  - Encrypting DEK with KMS...');
    const name = `projects/${PROJECT_ID}/locations/${LOCATION_ID}/keyRings/${KEY_RING_ID}/cryptoKeys/${KEY_ID}`;
    
    const [kmsResponse] = await kmsClient.encrypt({
      name: name,
      plaintext: dataKey
    });
    
    console.log('  - DEK encrypted with KMS');
    
    // Step 4: Combine everything
    const result = {
      encryptedData: encryptedData,
      encryptedKey: kmsResponse.ciphertext,
      iv: iv,
      algorithm: 'aes-256-cbc'
    };
    
    console.log('✅ DEK encryption completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ DEK Encryption Error:', error);
    throw new Error('Failed to encrypt file with DEK');
  }
};

const decryptFileWithDEK = async (encryptedFileData) => {
  try {
    console.log('🔓 Starting DEK decryption process...');
    
    // Step 1: Decrypt the data key with KMS
    const name = `projects/${PROJECT_ID}/locations/${LOCATION_ID}/keyRings/${KEY_RING_ID}/cryptoKeys/${KEY_ID}`;
    
    const [kmsResponse] = await kmsClient.decrypt({
      name: name,
      ciphertext: encryptedFileData.encryptedKey
    });
    
    const dataKey = kmsResponse.plaintext;
    console.log('  - DEK decrypted with KMS');
    
    // Step 2: Decrypt the file with AES-256-CBC using createDecipheriv
    const decipher = crypto.createDecipheriv('aes-256-cbc', dataKey, encryptedFileData.iv);
    
    let decryptedData = decipher.update(encryptedFileData.encryptedData);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);
    
    console.log('✅ DEK decryption completed successfully');
    return decryptedData;
    
  } catch (error) {
    console.error('❌ DEK Decryption Error:', error);
    throw new Error('Failed to decrypt file with DEK');
  }
};

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
    }
  }
});

// Multer error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  if (error.message === 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.') {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  next(error);
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Logging middleware
app.use(morgan('combined'));

// CORS middleware
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(/[,;]/).map(origin => origin.trim()).filter(origin => origin) // Support both comma and semicolon separators
  : [
      'http://localhost:3000', 
      'http://localhost:3001', // Admin Panel frontend
      'http://localhost:3002', // Additional Admin panel frontend if port is busy
      'https://admin-panel-frontend-693306869303.us-central1.run.app', // Cloud Run direct URL
      'https://admin.thegrowwell.com' // Custom domain URL
    ];

console.log('🌐 CORS Configuration:');
console.log('  - CORS_ORIGIN env var:', process.env.CORS_ORIGIN || 'not set');
console.log('  - Allowed origins:', corsOrigins);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 API requests per minute
  message: {
    success: false,
    error: 'Too many API requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
app.use(generalLimiter);

// Available pages that can be assigned to admins
const AVAILABLE_PAGES = [
  'dashboard',
  'users',
  'applications',
  'payments',
  'scheduled-calls',
  'feedbacks',
  'support-requests',
  'admin-users',
  'email-configuration'
];

// Map pages to permissions (for API endpoint access)
const PAGE_TO_PERMISSIONS = {
  'dashboard': [PERMISSIONS.VIEW_DASHBOARD],
  'users': [PERMISSIONS.VIEW_USERS, PERMISSIONS.EDIT_USERS, PERMISSIONS.DELETE_USERS],
  'applications': [PERMISSIONS.VIEW_APPLICATIONS, PERMISSIONS.EDIT_APPLICATIONS, PERMISSIONS.DELETE_APPLICATIONS],
  'payments': [PERMISSIONS.VIEW_PAYMENTS, PERMISSIONS.EDIT_PAYMENTS],
  'scheduled-calls': [PERMISSIONS.VIEW_APPOINTMENTS, PERMISSIONS.EDIT_APPOINTMENTS],
  'feedbacks': [PERMISSIONS.VIEW_FEEDBACK, PERMISSIONS.EDIT_FEEDBACK],
  'support-requests': [PERMISSIONS.VIEW_SUPPORT, PERMISSIONS.EDIT_SUPPORT],
  'admin-users': [PERMISSIONS.MANAGE_ADMINS],
  'email-configuration': [PERMISSIONS.MANAGE_ADMINS]
};

// Get permissions from pages array
const getPermissionsFromPages = (pages) => {
  if (!pages || !Array.isArray(pages)) {
    return [];
  }
  const permissions = new Set();
  pages.forEach(page => {
    if (PAGE_TO_PERMISSIONS[page]) {
      PAGE_TO_PERMISSIONS[page].forEach(perm => permissions.add(perm));
    }
  });
  return Array.from(permissions);
};

// Initialize default super admin if it doesn't exist
const initializeDefaultAdmin = async () => {
  try {
    const adminUsersRef = db.collection('adminUsers');
    const defaultAdminEmail = ADMIN_CREDENTIALS.email;
    
    // Check if default admin exists
    const adminQuery = await adminUsersRef.where('email', '==', defaultAdminEmail).limit(1).get();
    
    if (adminQuery.empty) {
      // Create default super admin with all pages
      const hashedPassword = await bcrypt.hash('password', 10);
      await adminUsersRef.add({
        email: defaultAdminEmail,
        password: hashedPassword,
        name: ADMIN_CREDENTIALS.name,
        role: 'super_admin', // Keep for backward compatibility
        pages: AVAILABLE_PAGES, // All pages for super admin
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: null,
      });
      console.log('✅ Default super admin created in Firestore');
    }
  } catch (error) {
    console.error('Error initializing default admin:', error);
  }
};

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
  // Check for token in Authorization header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  // If no token in header, check query parameters
  if (!token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    // Fetch admin user from Firestore to get latest permissions
    try {
      // Handle legacy admin
      if (decoded.adminId === 'legacy-admin') {
        req.admin = {
          ...decoded,
          id: 'legacy-admin',
          permissions: getPermissionsForRole('super_admin'),
          role: 'super_admin',
          name: ADMIN_CREDENTIALS.name,
          isActive: true
        };
        return next();
      }
      
      const adminUsersRef = db.collection('adminUsers');
      const adminQuery = await adminUsersRef.where('email', '==', decoded.email).limit(1).get();
      
      if (adminQuery.empty) {
        return res.status(403).json({
          success: false,
          error: 'Admin user not found'
        });
      }
      
      const adminDoc = adminQuery.docs[0];
      const adminData = adminDoc.data();
      
      // Check if admin is active
      if (!adminData.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Admin account is inactive'
        });
      }
      
      // Get permissions from pages (preferred) or role (backward compatibility)
      let permissions = [];
      if (adminData.pages && Array.isArray(adminData.pages) && adminData.pages.length > 0) {
        permissions = getPermissionsFromPages(adminData.pages);
      } else if (adminData.role) {
        permissions = getPermissionsForRole(adminData.role);
      }
      
      // Attach full admin data to request
      req.admin = {
        ...decoded,
        id: adminDoc.id,
        permissions: permissions,
        pages: adminData.pages || [],
        role: adminData.role || null,
        name: adminData.name,
        isActive: adminData.isActive
      };
      
      next();
    } catch (error) {
      console.error('Error fetching admin user:', error);
      return res.status(500).json({
        success: false,
        error: 'Error authenticating admin'
      });
    }
  });
};

// Helper function to add history entry to application
const addApplicationHistory = async (applicationId, action, details, performedBy = null, performedByType = 'admin') => {
  try {
    const historyEntry = {
      action: action, // e.g., 'status_changed', 'notes_updated', 'document_uploaded', 'application_created'
      details: details, // Object with relevant details
      performedBy: performedBy, // Admin name/ID or 'system' or user info
      performedByType: performedByType, // 'admin', 'user', 'system'
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add history entry to the application's history subcollection
    await db.collection('taxForms').doc(applicationId).collection('history').add(historyEntry);
    return true;
  } catch (error) {
    console.error('Error adding application history:', error);
    return false;
  }
};

// Permission checking middleware
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!hasPermission(req.admin.permissions || [], permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required'
    });
  }
  next();
};

// Input validation middleware
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Admin Panel Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Emergency endpoint to create/reset super admin (for first-time setup or recovery)
// WARNING: This should be disabled or protected in production!
app.post('/api/admin/emergency-create-super-admin', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const adminUsersRef = db.collection('adminUsers');
    
    // Check if admin already exists
    const existingQuery = await adminUsersRef.where('email', '==', normalizedEmail).limit(1).get();
    
    if (!existingQuery.empty) {
      // Update existing admin to super_admin and reset password
      const existingDoc = existingQuery.docs[0];
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await existingDoc.ref.update({
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        name: name || existingDoc.data().name || 'Super Admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({
        success: true,
        message: 'Super admin account updated successfully',
        data: {
          email: normalizedEmail,
          role: 'super_admin'
        }
      });
    }
    
    // Create new super admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdminRef = await adminUsersRef.add({
      email: normalizedEmail,
      password: hashedPassword,
      name: name || 'Super Admin',
      role: 'super_admin',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: null
    });
    
    res.status(201).json({
      success: true,
      message: 'Super admin account created successfully',
      data: {
        id: newAdminRef.id,
        email: normalizedEmail,
        role: 'super_admin'
      }
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create super admin',
      details: error.message
    });
  }
});

// Initialize default admin on startup (run immediately, but don't block)
initializeDefaultAdmin().catch(err => {
  console.error('Failed to initialize default admin:', err);
});

// Authentication endpoints
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateInput
], async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', { email, passwordLength: password?.length });
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log('📧 Normalized email:', normalizedEmail);
    console.log('📧 ADMIN_CREDENTIALS.email:', ADMIN_CREDENTIALS.email);
    console.log('🔑 ADMIN_CREDENTIALS.password hash:', ADMIN_CREDENTIALS.password);
    console.log('🔑 ADMIN_CREDENTIALS.password length:', ADMIN_CREDENTIALS.password?.length);

    // Find admin user in Firestore
    const adminUsersRef = db.collection('adminUsers');
    const adminQuery = await adminUsersRef.where('email', '==', normalizedEmail).limit(1).get();

    console.log('🔍 Firestore query result - empty:', adminQuery.empty);

    if (adminQuery.empty) {
      // Fallback to legacy credentials for backward compatibility
      console.log('🔍 Email comparison:', normalizedEmail, '===', ADMIN_CREDENTIALS.email, '?', normalizedEmail === ADMIN_CREDENTIALS.email);
      
      if (normalizedEmail !== ADMIN_CREDENTIALS.email) {
        console.log('❌ Email mismatch');
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      console.log('🔐 Comparing password...');
      console.log('🔐 Input password:', password);
      console.log('🔐 Stored hash:', ADMIN_CREDENTIALS.password);
      
      const isValidPassword = await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
      console.log('🔐 Password comparison result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Password mismatch');
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      console.log('✅ Password verified successfully');

      // Generate JWT tokens for legacy admin
      const accessToken = jwt.sign(
        { 
          adminId: 'legacy-admin',
          email: ADMIN_CREDENTIALS.email,
          name: ADMIN_CREDENTIALS.name,
          role: 'super_admin'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { 
          adminId: 'legacy-admin',
          email: ADMIN_CREDENTIALS.email,
          type: 'refresh'
        },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
      );

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken,
          refreshToken,
          admin: {
            id: 'legacy-admin',
            email: ADMIN_CREDENTIALS.email,
            name: ADMIN_CREDENTIALS.name,
            role: 'super_admin',
            pages: AVAILABLE_PAGES,
            permissions: getPermissionsFromPages(AVAILABLE_PAGES)
          }
        }
      });
    }

    // Admin user found in Firestore
    console.log('✅ Firestore user found');
    const adminDoc = adminQuery.docs[0];
    const adminData = adminDoc.data();
    
    console.log('📋 Firestore user data:', {
      email: adminData.email,
      name: adminData.name,
      role: adminData.role,
      isActive: adminData.isActive,
      passwordHash: adminData.password,
      passwordHashLength: adminData.password?.length
    });

    // Check if admin is active
    if (!adminData.isActive) {
      console.log('❌ Admin account is inactive');
      return res.status(403).json({
        success: false,
        error: 'Admin account is inactive. Please contact a super admin.'
      });
    }

    // Verify password against Firestore hash
    console.log('🔐 Comparing password against Firestore hash...');
    console.log('🔐 Input password:', password);
    console.log('🔐 Firestore hash:', adminData.password);
    
    let isValidPassword = await bcrypt.compare(password, adminData.password);
    console.log('🔐 Firestore password comparison result:', isValidPassword);
    
    // If Firestore password doesn't match, try ADMIN_CREDENTIALS as fallback
    if (!isValidPassword && normalizedEmail === ADMIN_CREDENTIALS.email) {
      console.log('🔄 Firestore password failed, trying ADMIN_CREDENTIALS fallback...');
      const isValidLegacyPassword = await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
      console.log('🔐 ADMIN_CREDENTIALS password comparison result:', isValidLegacyPassword);
      
      if (isValidLegacyPassword) {
        console.log('✅ ADMIN_CREDENTIALS password verified, updating Firestore user...');
        // Update Firestore user with new password hash
        await adminDoc.ref.update({
          password: ADMIN_CREDENTIALS.password,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Firestore password updated successfully');
        isValidPassword = true; // Set to true so authentication continues
      } else {
        console.log('❌ Both Firestore and ADMIN_CREDENTIALS passwords failed');
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    } else if (!isValidPassword) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    console.log('✅ Password verified successfully');

    // Update last login timestamp
    await adminDoc.ref.update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { 
        adminId: adminDoc.id,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { 
        adminId: adminDoc.id,
        email: adminData.email,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Get permissions from pages (preferred) or role (backward compatibility)
    let permissions = [];
    let pages = [];
    if (adminData.pages && Array.isArray(adminData.pages) && adminData.pages.length > 0) {
      pages = adminData.pages;
      permissions = getPermissionsFromPages(pages);
    } else if (adminData.role) {
      permissions = getPermissionsForRole(adminData.role);
      // For backward compatibility, assign pages based on role
      if (adminData.role === 'super_admin') {
        pages = AVAILABLE_PAGES;
      } else if (adminData.role === 'admin') {
        pages = AVAILABLE_PAGES.filter(p => p !== 'admin-users');
      } else {
        pages = ['dashboard', 'users', 'applications', 'payments', 'scheduled-calls', 'feedbacks', 'support-requests'];
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        admin: {
          id: adminDoc.id,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role || null,
          pages: pages,
          permissions: permissions
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
});

app.post('/api/auth/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validateInput
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    jwt.verify(refreshToken, JWT_SECRET, async (err, decoded) => {
      if (err || decoded.type !== 'refresh') {
        return res.status(403).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Fetch admin user from Firestore
      let adminData;
      if (decoded.adminId === 'legacy-admin') {
        // Legacy admin
        adminData = {
          email: ADMIN_CREDENTIALS.email,
          name: ADMIN_CREDENTIALS.name,
          role: 'super_admin'
        };
      } else {
        const adminDoc = await db.collection('adminUsers').doc(decoded.adminId).get();
        if (!adminDoc.exists || !adminDoc.data().isActive) {
          return res.status(403).json({
            success: false,
            error: 'Admin user not found or inactive'
          });
        }
        adminData = adminDoc.data();
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { 
          adminId: decoded.adminId,
          email: decoded.email,
          name: adminData.name,
          role: adminData.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        data: {
          accessToken
        }
      });
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message
    });
  }
});

app.post('/api/auth/logout', authenticateAdmin, (req, res) => {
  // In a real application, you would blacklist the token
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Protected Admin API endpoints

// ============================================
// Admin User Management Endpoints (Super Admin Only)
// ============================================

// Get available pages
app.get('/api/admin/available-pages', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const pageLabels = {
      'dashboard': 'Dashboard / Home',
      'users': 'Users',
      'applications': 'Applications',
      'payments': 'Payments',
      'scheduled-calls': 'Scheduled Calls',
      'feedbacks': 'Feedbacks',
      'support-requests': 'Support Requests',
      'admin-users': 'Admin Users',
      'email-configuration': 'Email Configuration'
    };
    
    const pages = AVAILABLE_PAGES.map(page => ({
      value: page,
      label: pageLabels[page] || page
    }));
    
    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Error fetching available pages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available pages',
      details: error.message
    });
  }
});

// Get all admin users
app.get('/api/admin-users', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const adminUsersSnapshot = await db.collection('adminUsers').get();
    const adminUsers = [];
    
    adminUsersSnapshot.forEach(doc => {
      const data = doc.data();
      // Don't send password hash
      adminUsers.push({
        id: doc.id,
        email: data.email,
        name: data.name,
        pages: data.pages || [],
        role: data.role || null,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastLoginAt: data.lastLoginAt
      });
    });
    
    res.json({
      success: true,
      data: adminUsers,
      count: adminUsers.length
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin users',
      details: error.message
    });
  }
});

// Create admin user
app.post('/api/admin-users', [
  authenticateAdmin,
  requireSuperAdmin,
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('pages').isArray().withMessage('Pages must be an array'),
  body('pages.*').isIn(AVAILABLE_PAGES).withMessage('Invalid page in pages array'),
  validateInput
], async (req, res) => {
  try {
    const { email, password, name, pages, isActive = true } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate pages
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one page must be selected'
      });
    }
    
    // Validate all pages are in available pages list
    const invalidPages = pages.filter(page => !AVAILABLE_PAGES.includes(page));
    if (invalidPages.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid pages: ${invalidPages.join(', ')}`
      });
    }
    
    // Check if admin user already exists
    const adminUsersRef = db.collection('adminUsers');
    const existingAdmin = await adminUsersRef.where('email', '==', normalizedEmail).limit(1).get();
    
    if (!existingAdmin.empty) {
      return res.status(400).json({
        success: false,
        error: 'Admin user with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Determine role for backward compatibility (if all pages = super_admin, else admin)
    const role = pages.includes('admin-users') && pages.length === AVAILABLE_PAGES.length ? 'super_admin' : 'admin';
    
    // Create admin user
    const newAdminRef = await adminUsersRef.add({
      email: normalizedEmail,
      password: hashedPassword,
      name: name.trim(),
      pages: pages,
      role: role, // Keep for backward compatibility
      isActive: isActive,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: null
    });
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: newAdminRef.id,
        email: normalizedEmail,
        name: name.trim(),
        pages: pages,
        role: role,
        isActive: isActive
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user',
      details: error.message
    });
  }
});

// Update admin user
app.put('/api/admin-users/:id', [
  authenticateAdmin,
  requireSuperAdmin,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('pages').optional().isArray().withMessage('Pages must be an array'),
  body('pages.*').optional().isIn(AVAILABLE_PAGES).withMessage('Invalid page in pages array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  validateInput
], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pages, isActive, password } = req.body;
    
    const adminDoc = await db.collection('adminUsers').doc(id).get();
    
    if (!adminDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    
    if (pages !== undefined) {
      if (!Array.isArray(pages) || pages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one page must be selected'
        });
      }
      
      // Validate all pages are in available pages list
      const invalidPages = pages.filter(page => !AVAILABLE_PAGES.includes(page));
      if (invalidPages.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid pages: ${invalidPages.join(', ')}`
        });
      }
      
      updateData.pages = pages;
      // Update role for backward compatibility
      updateData.role = pages.includes('admin-users') && pages.length === AVAILABLE_PAGES.length ? 'super_admin' : 'admin';
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    await adminDoc.ref.update(updateData);
    
    const updatedData = adminDoc.data();
    res.json({
      success: true,
      message: 'Admin user updated successfully',
      data: {
        id: id,
        email: updatedData.email,
        name: updateData.name || updatedData.name,
        pages: updateData.pages || updatedData.pages || [],
        role: updateData.role || updatedData.role || null,
        isActive: updateData.isActive !== undefined ? updateData.isActive : updatedData.isActive
      }
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update admin user',
      details: error.message
    });
  }
});

// Delete admin user
app.delete('/api/admin-users/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (req.admin.id === id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }
    
    const adminDoc = await db.collection('adminUsers').doc(id).get();
    
    if (!adminDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }
    
    await adminDoc.ref.delete();
    
    res.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete admin user',
      details: error.message
    });
  }
});

// ============================================
// Email Configuration Endpoints (Super Admin Only)
// ============================================

// Get email configuration
app.get('/api/email-configuration', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const emailConfigRef = db.collection('emailConfiguration').doc('settings');
    const emailConfigDoc = await emailConfigRef.get();
    
    if (!emailConfigDoc.exists) {
      // Return default empty configuration
      return res.json({
        success: true,
        data: {
          smtpHost: '',
          smtpPort: '',
          smtpSecure: true,
          smtpUser: '',
          smtpPassword: '',
          fromEmail: '',
          fromName: '',
          adminEmails: '',
          enabled: false
        }
      });
    }
    
    const data = emailConfigDoc.data();
    // Don't send password in response (frontend will handle it separately)
    res.json({
      success: true,
      data: {
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort || '',
        smtpSecure: data.smtpSecure !== undefined ? data.smtpSecure : true,
        smtpUser: data.smtpUser || '',
        smtpPassword: '', // Don't send password back
        fromEmail: data.fromEmail || '',
        fromName: data.fromName || '',
        adminEmails: data.adminEmails || '',
        enabled: data.enabled !== undefined ? data.enabled : false,
        updatedAt: data.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching email configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email configuration',
      details: error.message
    });
  }
});

// Save email configuration
app.put('/api/email-configuration', 
  authenticateAdmin,
  requireSuperAdmin,
  [
    body('smtpHost').notEmpty().withMessage('SMTP Host is required'),
    body('smtpPort').notEmpty().withMessage('SMTP Port is required'),
    body('smtpPort').isNumeric().withMessage('SMTP Port must be a number'),
    body('smtpUser').notEmpty().withMessage('SMTP Username is required'),
    // Password is optional - only required if document doesn't exist yet
    body('fromEmail').isEmail().withMessage('Valid From Email is required'),
    body('fromName').notEmpty().withMessage('From Name is required'),
    body('adminEmails').notEmpty().withMessage('Admin Email(s) is required'),
    validateInput
  ],
  async (req, res) => {
    try {
      const {
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPassword,
        fromEmail,
        fromName,
        adminEmails,
        enabled
      } = req.body;
      
      // Validate admin emails format
      const adminEmailList = adminEmails.split(',').map(email => email.trim()).filter(email => email);
      const emailRegex = /\S+@\S+\.\S+/;
      const invalidEmails = adminEmailList.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid admin email(s): ${invalidEmails.join(', ')}`
        });
      }
      
      const emailConfigRef = db.collection('emailConfiguration').doc('settings');
      
      // Check if document exists
      const existingDoc = await emailConfigRef.get();
      const existingData = existingDoc.exists ? existingDoc.data() : null;
      
      // Prepare update data
      const updateData = {
        smtpHost: smtpHost.trim(),
        smtpPort: parseInt(smtpPort),
        smtpSecure: smtpSecure !== undefined ? smtpSecure : true,
        smtpUser: smtpUser.trim(),
        fromEmail: fromEmail.trim().toLowerCase(),
        fromName: fromName.trim(),
        adminEmails: adminEmailList.join(', '),
        enabled: enabled !== undefined ? enabled : false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Only update password if a new one is provided
      // If password is empty and document exists, keep the existing password
      if (smtpPassword && smtpPassword.trim() !== '') {
        updateData.smtpPassword = smtpPassword;
      } else if (!existingDoc.exists) {
        // If document doesn't exist and no password provided, return error
        return res.status(400).json({
          success: false,
          error: 'SMTP Password is required for initial configuration'
        });
      } else {
        // Keep existing password if not provided
        updateData.smtpPassword = existingData.smtpPassword;
      }
      
      // Set createdAt only if document doesn't exist
      if (!existingDoc.exists) {
        updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      }
      
      await emailConfigRef.set(updateData, { merge: true });
      
      res.json({
        success: true,
        message: 'Email configuration saved successfully',
        data: {
          smtpHost: updateData.smtpHost,
          smtpPort: updateData.smtpPort,
          smtpSecure: updateData.smtpSecure,
          smtpUser: updateData.smtpUser,
          fromEmail: updateData.fromEmail,
          fromName: updateData.fromName,
          adminEmails: updateData.adminEmails,
          enabled: updateData.enabled
        }
      });
    } catch (error) {
      console.error('Error saving email configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save email configuration',
        details: error.message
      });
    }
  }
);

// Test email configuration
app.post('/api/email-configuration/test', 
  authenticateAdmin,
  requireSuperAdmin,
  [
    body('smtpHost').notEmpty().withMessage('SMTP Host is required'),
    body('smtpPort').notEmpty().withMessage('SMTP Port is required'),
    body('smtpPort').isNumeric().withMessage('SMTP Port must be a number'),
    body('smtpUser').notEmpty().withMessage('SMTP Username is required'),
    // Password is optional - will use stored password if not provided
    body('fromEmail').isEmail().withMessage('Valid From Email is required'),
    body('fromName').notEmpty().withMessage('From Name is required'),
    body('adminEmails').notEmpty().withMessage('Admin Email(s) is required'),
    validateInput
  ],
  async (req, res) => {
    try {
      const {
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPassword,
        fromEmail,
        fromName,
        adminEmails
      } = req.body;
      
      // Validate admin emails format
      const adminEmailList = adminEmails.split(',').map(email => email.trim()).filter(email => email);
      const emailRegex = /\S+@\S+\.\S+/;
      const invalidEmails = adminEmailList.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid admin email(s): ${invalidEmails.join(', ')}`
        });
      }
      
      // Get stored password if not provided
      let passwordToUse = smtpPassword;
      if (!passwordToUse || passwordToUse.trim() === '') {
        const emailConfigRef = db.collection('emailConfiguration').doc('settings');
        const emailConfigDoc = await emailConfigRef.get();
        if (!emailConfigDoc.exists || !emailConfigDoc.data().smtpPassword) {
          return res.status(400).json({
            success: false,
            error: 'SMTP Password is required. Please enter your password or save configuration first.'
          });
        }
        passwordToUse = emailConfigDoc.data().smtpPassword;
      }
      
      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost.trim(),
        port: parseInt(smtpPort),
        secure: smtpSecure !== undefined ? smtpSecure : (parseInt(smtpPort) === 465),
        auth: {
          user: smtpUser.trim(),
          pass: passwordToUse
        }
      });
      
      // Verify SMTP connection
      await transporter.verify();
      
      // Send test email to first admin email
      const testEmail = adminEmailList[0];
      const mailOptions = {
        from: `"${fromName.trim()}" <${fromEmail.trim()}>`,
        to: testEmail,
        subject: 'Test Email - Email Configuration',
        html: `
          <h2>Test Email</h2>
          <p>This is a test email from your email configuration.</p>
          <p>If you received this email, your SMTP settings are configured correctly!</p>
          <hr>
          <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
        `,
        text: `Test Email\n\nThis is a test email from your email configuration.\n\nIf you received this email, your SMTP settings are configured correctly!\n\nSent at: ${new Date().toLocaleString()}`
      };
      
      await transporter.sendMail(mailOptions);
      
      res.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        data: {
          recipient: testEmail,
          sentAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: error.message
      });
    }
  }
);

// ============================================
// Email Notification Trigger Endpoints
// These can be called from the main backend to trigger email notifications
// No authentication required - these are internal API calls
// ============================================

// Trigger email notification for new user registration
app.post('/api/notifications/new-user', async (req, res) => {
  try {
    const { userData } = req.body;
    
    if (!userData) {
      return res.status(400).json({
        success: false,
        error: 'User data is required'
      });
    }
    
    const result = await emailService.notifyNewUser(db, userData);
    
    res.json({
      success: result.success,
      message: result.success ? 'Email notification sent' : 'Email notification failed',
      reason: result.reason
    });
  } catch (error) {
    console.error('Error triggering new user notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger notification',
      details: error.message
    });
  }
});

// Trigger email notification for new application
app.post('/api/notifications/new-application', async (req, res) => {
  try {
    const { applicationData, userData } = req.body;
    
    if (!applicationData || !userData) {
      return res.status(400).json({
        success: false,
        error: 'Application data and user data are required'
      });
    }
    
    const result = await emailService.notifyNewApplication(db, applicationData, userData);
    
    res.json({
      success: result.success,
      message: result.success ? 'Email notification sent' : 'Email notification failed',
      reason: result.reason
    });
  } catch (error) {
    console.error('Error triggering new application notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger notification',
      details: error.message
    });
  }
});

// Trigger email notification for additional document
app.post('/api/notifications/additional-document', async (req, res) => {
  try {
    const { documentData, userData, applicationId } = req.body;
    
    if (!documentData || !userData) {
      return res.status(400).json({
        success: false,
        error: 'Document data and user data are required'
      });
    }
    
    const result = await emailService.notifyAdditionalDocument(db, documentData, userData, applicationId);
    
    res.json({
      success: result.success,
      message: result.success ? 'Email notification sent' : 'Email notification failed',
      reason: result.reason
    });
  } catch (error) {
    console.error('Error triggering additional document notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger notification',
      details: error.message
    });
  }
});

// Trigger email notification for draft approval
app.post('/api/notifications/draft-approval', async (req, res) => {
  try {
    const { applicationData, userData } = req.body;
    
    if (!applicationData || !userData) {
      return res.status(400).json({
        success: false,
        error: 'Application data and user data are required'
      });
    }
    
    const result = await emailService.notifyDraftApproval(db, applicationData, userData);
    
    res.json({
      success: result.success,
      message: result.success ? 'Email notification sent' : 'Email notification failed',
      reason: result.reason
    });
  } catch (error) {
    console.error('Error triggering draft approval notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger notification',
      details: error.message
    });
  }
});

// Trigger email notification for payment
app.post('/api/notifications/payment', async (req, res) => {
  try {
    const { paymentData, userData } = req.body;
    
    if (!paymentData || !userData) {
      return res.status(400).json({
        success: false,
        error: 'Payment data and user data are required'
      });
    }
    
    const result = await emailService.notifyPayment(db, paymentData, userData);
    
    res.json({
      success: result.success,
      message: result.success ? 'Email notification sent' : 'Email notification failed',
      reason: result.reason
    });
  } catch (error) {
    console.error('Error triggering payment notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger notification',
      details: error.message
    });
  }
});

// Get all users
app.get('/api/users', authenticateAdmin, checkPermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: error.message
    });
  }
});

// Get all tax forms
app.get('/api/tax-forms', authenticateAdmin, checkPermission(PERMISSIONS.VIEW_APPLICATIONS), async (req, res) => {
  try {
    const formsSnapshot = await db.collection('taxForms').get();
    const forms = [];
    
    // Process each form and fetch user data
    for (const doc of formsSnapshot.docs) {
      const taxFormData = doc.data();
      let userData = null;
      
      // Get user information if userId exists
      if (taxFormData.userId) {
        try {
          const userDoc = await db.collection('users').doc(taxFormData.userId).get();
          if (userDoc.exists) {
            userData = {
              id: userDoc.id,
              ...userDoc.data()
            };
          }
        } catch (userError) {
          console.warn(`Failed to fetch user data for userId: ${taxFormData.userId}`, userError.message);
        }
      }
      
      forms.push({
        id: doc.id,
        ...taxFormData,
        user: userData
      });
    }
    
    res.json({
      success: true,
      data: forms,
      count: forms.length
    });
  } catch (error) {
    console.error('Error fetching tax forms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax forms',
      details: error.message
    });
  }
});

// Get detailed tax form by ID
app.get('/api/tax-forms/:id', authenticateAdmin, checkPermission(PERMISSIONS.VIEW_APPLICATIONS), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tax form ID is required'
      });
    }
    
    // Get tax form document
    const taxFormDoc = await db.collection('taxForms').doc(id).get();
    
    if (!taxFormDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Tax form not found'
      });
    }
    
    const taxFormData = taxFormDoc.data();
    
    // Get history entries
    let history = [];
    try {
      const historySnapshot = await db.collection('taxForms').doc(id).collection('history')
        .orderBy('timestamp', 'desc')
        .get();
      history = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching history:', error);
      // Continue without history if there's an error
    }
    
    // Get user information
    let userData = null;
    if (taxFormData.userId) {
      const userDoc = await db.collection('users').doc(taxFormData.userId).get();
      if (userDoc.exists) {
        userData = {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
    }
    
    // Prepare response with all data
    const response = {
      id: taxFormDoc.id,
      ...taxFormData,
      user: userData,
      history: history,
      // Ensure documents have proper structure
      documents: taxFormData.documents || [],
      // Ensure dependents have proper structure
      dependents: taxFormData.dependents || [],
      // Ensure additional income sources have proper structure
      additionalIncomeSources: taxFormData.additionalIncomeSources || []
    };
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching tax form details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax form details',
      details: error.message
    });
  }
});

// Update tax form status and expected return
app.put('/api/tax-forms/:id/status', authenticateAdmin, checkPermission(PERMISSIONS.EDIT_APPLICATIONS), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, expectedReturn, paymentAmount, adminNotes } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tax form ID is required'
      });
    }
    
    // Check if tax form exists
    const taxFormDoc = await db.collection('taxForms').doc(id).get();
    if (!taxFormDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Tax form not found'
      });
    }
    
    // Validate status
    const validStatuses = [
      'submitted', // Legacy - kept for backward compatibility
      'new_application_submitted', // Initial state when user submits application
      'processing', // Admin reviewing application and documents
      'awaiting_for_documents', // Admin requesting additional/reuploaded documents
      'new_documents_submitted', // Auto-set when user uploads new documents
      'draft_uploaded', // Admin uploads draft document
      'draft_rejected', // User cancels/rejects from mobile app
      'payment_completed', // Auto-set when user makes payment
      'close_application', // Admin sets when user uploads final document
      'under_review', // Legacy - kept for backward compatibility
      'approved', // Legacy - kept for backward compatibility
      'rejected', // Legacy - kept for backward compatibility
      'completed' // Legacy - kept for backward compatibility
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Prepare update data
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (status) {
      updateData.status = status;
    }
    
    if (expectedReturn !== undefined) {
      updateData.expectedReturn = parseFloat(expectedReturn) || 0;
    }
    
    if (paymentAmount !== undefined) {
      updateData.paymentAmount = parseFloat(paymentAmount) || 0;
    }
    
    if (adminNotes) {
      // Sanitize admin notes
      const sanitizedNotes = adminNotes
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .substring(0, 1000); // Limit length
      
      updateData.adminNotes = sanitizedNotes;
      updateData.adminNotesUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    // Get old data for history tracking
    const oldData = taxFormDoc.data();
    
    // Update tax form
    await db.collection('taxForms').doc(id).update(updateData);
    
    // Add history entries for changes
    const adminName = req.admin?.name || req.admin?.email || 'Unknown Admin';
    const adminId = req.admin?.id || 'unknown';
    
    if (status && status !== oldData.status) {
      await addApplicationHistory(id, 'status_changed', {
        oldStatus: oldData.status,
        newStatus: status,
        statusDisplayName: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }, `${adminName} (${adminId})`, 'admin');
    }
    
    if (adminNotes && adminNotes !== oldData.adminNotes) {
      await addApplicationHistory(id, 'notes_updated', {
        notesLength: adminNotes.length,
        hasNotes: adminNotes.length > 0
      }, `${adminName} (${adminId})`, 'admin');
    }
    
    if (expectedReturn !== undefined && expectedReturn !== oldData.expectedReturn) {
      await addApplicationHistory(id, 'expected_return_updated', {
        oldValue: oldData.expectedReturn || 0,
        newValue: expectedReturn
      }, `${adminName} (${adminId})`, 'admin');
    }
    
    if (paymentAmount !== undefined && paymentAmount !== oldData.paymentAmount) {
      await addApplicationHistory(id, 'payment_amount_updated', {
        oldValue: oldData.paymentAmount || 0,
        newValue: paymentAmount
      }, `${adminName} (${adminId})`, 'admin');
    }
    
    // Get updated document to return latest data including timestamp
    const updatedDoc = await db.collection('taxForms').doc(id).get();
    const updatedData = updatedDoc.data();
    
    // Send email notification for draft approval when status changes to draft_uploaded (non-blocking)
    if (status === 'draft_uploaded' && oldData.status !== 'draft_uploaded') {
      const userDoc = await db.collection('users').doc(updatedData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        emailService.notifyDraftApproval(db, { id, ...updatedData }, userData).catch(err => {
          console.error('Failed to send email notification for draft approval:', err);
        });
      }
    }
    
    // Send email notification for payment when status changes to payment_completed (non-blocking)
    if (status === 'payment_completed' && oldData.status !== 'payment_completed') {
      const userDoc = await db.collection('users').doc(updatedData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        // Get payment info from payments collection if available
        const paymentsSnapshot = await db.collection('payments')
          .where('userId', '==', updatedData.userId)
          .where('applicationId', '==', id)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        
        let paymentData = {
          id: id,
          amount: updatedData.paymentAmount || 0,
          status: 'completed'
        };
        
        if (!paymentsSnapshot.empty) {
          const paymentDoc = paymentsSnapshot.docs[0].data();
          paymentData = {
            id: paymentsSnapshot.docs[0].id,
            ...paymentData,
            ...paymentDoc
          };
        }
        
        emailService.notifyPayment(db, paymentData, userData).catch(err => {
          console.error('Failed to send email notification for payment:', err);
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Tax form updated successfully',
      data: {
        id: id,
        status: status || updatedData.status,
        expectedReturn: expectedReturn !== undefined ? updateData.expectedReturn : updatedData.expectedReturn,
        paymentAmount: paymentAmount !== undefined ? updateData.paymentAmount : updatedData.paymentAmount,
        adminNotes: updateData.adminNotes || updatedData.adminNotes,
        adminNotesUpdatedAt: updatedData.adminNotesUpdatedAt || null
      }
    });
  } catch (error) {
    console.error('Error updating tax form status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tax form status',
      details: error.message
    });
  }
});

// Get all appointments with enhanced filtering and pagination
app.get('/api/appointments', authenticateAdmin, checkPermission(PERMISSIONS.VIEW_APPOINTMENTS), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, dateFrom, dateTo } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Get all appointments first (to avoid index issues)
    const allAppointmentsSnapshot = await db.collection('appointments').orderBy('createdAt', 'desc').get();
    let allAppointments = [];
    
    allAppointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      allAppointments.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        appointmentType: data.appointmentType,
        date: data.date,
        time: data.time,
        notes: data.notes,
        adminNotes: data.adminNotes || null,
        status: data.status,
        duration: data.duration,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    
    // Apply status filter if provided (client-side)
    if (status && status !== 'all') {
      allAppointments = allAppointments.filter(apt => apt.status === status);
    }
    
    // Apply date range filter if provided (client-side)
    if (dateFrom) {
      allAppointments = allAppointments.filter(apt => apt.date >= dateFrom);
    }
    if (dateTo) {
      allAppointments = allAppointments.filter(apt => apt.date <= dateTo);
    }
    
    // Apply search filter if provided (client-side)
    if (search) {
      const searchTerm = search.toLowerCase();
      allAppointments = allAppointments.filter(apt => 
        apt.userName.toLowerCase().includes(searchTerm) ||
        apt.userEmail.toLowerCase().includes(searchTerm) ||
        apt.appointmentType.toLowerCase().includes(searchTerm) ||
        apt.notes.toLowerCase().includes(searchTerm)
      );
    }
    
    const totalCount = allAppointments.length;
    
    // Apply pagination (client-side)
    const startIndex = offset;
    const endIndex = startIndex + limitNum;
    const paginatedAppointments = allAppointments.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedAppointments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount: totalCount,
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments',
      details: error.message
    });
  }
});

// Update appointment status
app.put('/api/appointments/status', authenticateAdmin, checkPermission(PERMISSIONS.EDIT_APPOINTMENTS), async (req, res) => {
  try {
    const { appointmentId, status, adminNotes } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID and status are required'
      });
    }

    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: scheduled, confirmed, completed, cancelled, rescheduled'
      });
    }

    // Check if appointment exists
    const appointmentDoc = await db.collection('appointments').doc(appointmentId).get();
    if (!appointmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Update appointment status and admin notes
    const updateData = {
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (adminNotes && adminNotes.trim()) {
      // Sanitize admin notes
      const sanitizedNotes = adminNotes
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .substring(0, 1000); // Limit length
      
      updateData.adminNotes = sanitizedNotes;
      updateData.adminNotesUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await db.collection('appointments').doc(appointmentId).update(updateData);

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: {
        appointmentId: appointmentId,
        status: status,
        adminNotes: updateData.adminNotes || null
      }
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment status',
      details: error.message
    });
  }
});

// Reschedule appointment with new date and time
app.put('/api/appointments/reschedule', authenticateAdmin, checkPermission(PERMISSIONS.EDIT_APPOINTMENTS), async (req, res) => {
  try {
    const { appointmentId, newDate, newTime, adminNotes } = req.body;

    if (!appointmentId || !newDate || !newTime) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID, new date, and new time are required'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Validate time format (HH:MM AM/PM)
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    if (!timeRegex.test(newTime)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time format. Use HH:MM AM/PM (e.g., 10:30 AM)'
      });
    }

    // Check if appointment exists
    const appointmentDoc = await db.collection('appointments').doc(appointmentId).get();
    if (!appointmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    const appointmentData = appointmentDoc.data();

    // Check if the new date/time slot is available
    const existingAppointments = await db.collection('appointments')
      .where('date', '==', newDate)
      .where('time', '==', newTime)
      .where('status', 'in', ['scheduled', 'confirmed'])
      .get();

    // Filter out the current appointment from conflicts
    const conflicts = existingAppointments.docs.filter(doc => doc.id !== appointmentId);
    
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'The selected date and time slot is already booked. Please choose a different time.'
      });
    }

    // Prepare update data
    const updateData = {
      date: newDate,
      time: newTime,
      status: 'rescheduled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (adminNotes) {
      // Sanitize admin notes
      const sanitizedNotes = adminNotes
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .substring(0, 1000); // Limit length
      
      updateData.adminNotes = sanitizedNotes;
    }

    // Store original date/time for reference
    updateData.originalDate = appointmentData.date;
    updateData.originalTime = appointmentData.time;
    updateData.rescheduledAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('appointments').doc(appointmentId).update(updateData);

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: {
        appointmentId: appointmentId,
        newDate: newDate,
        newTime: newTime,
        originalDate: appointmentData.date,
        originalTime: appointmentData.time,
        status: 'rescheduled',
        adminNotes: updateData.adminNotes || null
      }
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule appointment',
      details: error.message
    });
  }
});

// Update admin notes for appointment
app.put('/api/appointments/notes', authenticateAdmin, checkPermission(PERMISSIONS.EDIT_APPOINTMENTS), async (req, res) => {
  try {
    const { appointmentId, adminNotes } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    // Check if appointment exists
    const appointmentDoc = await db.collection('appointments').doc(appointmentId).get();
    if (!appointmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (adminNotes && adminNotes.trim()) {
      // Sanitize admin notes
      const sanitizedNotes = adminNotes
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .substring(0, 1000); // Limit length
      
      updateData.adminNotes = sanitizedNotes;
      updateData.adminNotesUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
    } else {
      // If empty notes, remove the field
      updateData.adminNotes = admin.firestore.FieldValue.delete();
      updateData.adminNotesUpdatedAt = admin.firestore.FieldValue.delete();
    }

    await db.collection('appointments').doc(appointmentId).update(updateData);

    res.json({
      success: true,
      message: 'Admin notes updated successfully',
      data: {
        appointmentId: appointmentId,
        adminNotes: updateData.adminNotes || null
      }
    });
  } catch (error) {
    console.error('Error updating admin notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update admin notes',
      details: error.message
    });
  }
});

// Delete appointment
app.delete('/api/appointments/:id', authenticateAdmin, checkPermission(PERMISSIONS.EDIT_APPOINTMENTS), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    // Check if appointment exists
    const appointmentDoc = await db.collection('appointments').doc(id).get();
    if (!appointmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Delete appointment
    await db.collection('appointments').doc(id).delete();

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete appointment',
      details: error.message
    });
  }
});

// Get appointment statistics
app.get('/api/appointments/stats', authenticateAdmin, async (req, res) => {
  try {
    const appointmentsSnapshot = await db.collection('appointments').get();
    const appointments = [];
    
    appointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      appointments.push({
        status: data.status,
        appointmentType: data.appointmentType,
        date: data.date,
        createdAt: data.createdAt
      });
    });

    // Calculate statistics
    const stats = {
      total: appointments.length,
      byStatus: {
        scheduled: appointments.filter(apt => apt.status === 'scheduled').length,
        confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
        completed: appointments.filter(apt => apt.status === 'completed').length,
        cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
        rescheduled: appointments.filter(apt => apt.status === 'rescheduled').length
      },
      byType: {
        consultation: appointments.filter(apt => apt.appointmentType === 'consultation').length,
        review: appointments.filter(apt => apt.appointmentType === 'review').length,
        filing: appointments.filter(apt => apt.appointmentType === 'filing').length,
        planning: appointments.filter(apt => apt.appointmentType === 'planning').length
      },
      today: appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]).length,
      thisWeek: appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        return aptDate >= weekStart && aptDate <= weekEnd;
      }).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching appointment statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointment statistics',
      details: error.message
    });
  }
});

// Get all payments
app.get('/api/payments', authenticateAdmin, checkPermission(PERMISSIONS.VIEW_PAYMENTS), async (req, res) => {
  try {
    const paymentsSnapshot = await db.collection('payments').get();
    const payments = [];
    
    paymentsSnapshot.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments',
      details: error.message
    });
  }
});

// Get all support requests
app.get('/api/support-requests', authenticateAdmin, checkPermission(PERMISSIONS.VIEW_SUPPORT), async (req, res) => {
  try {
    const requestsSnapshot = await db.collection('supportRequests').get();
    const requests = [];
    
    requestsSnapshot.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching support requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support requests',
      details: error.message
    });
  }
});

// Get all feedback with proper formatting
app.get('/api/feedback', authenticateAdmin, checkPermission(PERMISSIONS.VIEW_FEEDBACK), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = db.collection('feedback');
    
    // Get all feedback first (to avoid index issues)
    const allFeedbackSnapshot = await query.orderBy('createdAt', 'desc').get();
    let allFeedback = [];
    
    allFeedbackSnapshot.forEach(doc => {
      const data = doc.data();
      allFeedback.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        rating: data.rating,
        feedback: data.feedback,
        category: data.category,
        status: data.status,
        adminReply: data.adminReply || '',
        repliedBy: data.repliedBy || '',
        repliedAt: data.repliedAt || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    
    // Apply status filter if provided (client-side)
    if (status && status !== 'all') {
      allFeedback = allFeedback.filter(fb => fb.status === status);
    }
    
    // Apply search filter if provided (client-side)
    if (search) {
      const searchTerm = search.toLowerCase();
      allFeedback = allFeedback.filter(fb => 
        fb.userName.toLowerCase().includes(searchTerm) ||
        fb.userEmail.toLowerCase().includes(searchTerm) ||
        fb.feedback.toLowerCase().includes(searchTerm) ||
        (fb.adminReply && fb.adminReply.toLowerCase().includes(searchTerm))
      );
    }
    
    const totalCount = allFeedback.length;
    
    // Apply pagination (client-side)
    const startIndex = offset;
    const endIndex = startIndex + limitNum;
    const paginatedFeedback = allFeedback.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedFeedback,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount: totalCount,
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback',
      details: error.message
    });
  }
});

// Reply to feedback
app.post('/api/feedback/reply', authenticateAdmin, checkPermission(PERMISSIONS.EDIT_FEEDBACK), async (req, res) => {
  try {
    const { feedbackId, reply, adminName = 'Admin' } = req.body;

    if (!feedbackId || !reply) {
      return res.status(400).json({
        success: false,
        error: 'Feedback ID and reply are required'
      });
    }

    // Sanitize reply
    const sanitizedReply = reply
      .trim()
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length

    if (sanitizedReply.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Reply must be at least 5 characters long'
      });
    }

    // Check if feedback exists
    const feedbackDoc = await db.collection('feedback').doc(feedbackId).get();
    if (!feedbackDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    // Update feedback with reply
    await db.collection('feedback').doc(feedbackId).update({
      adminReply: sanitizedReply,
      status: 'replied',
      repliedBy: adminName,
      repliedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        feedbackId: feedbackId,
        reply: sanitizedReply,
        status: 'replied'
      }
    });
  } catch (error) {
    console.error('Error replying to feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reply',
      details: error.message
    });
  }
});

// Update feedback status
app.put('/api/feedback/status', authenticateAdmin, checkPermission(PERMISSIONS.EDIT_FEEDBACK), async (req, res) => {
  try {
    const { feedbackId, status } = req.body;

    if (!feedbackId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Feedback ID and status are required'
      });
    }

    const validStatuses = ['pending', 'replied', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, replied, resolved, closed'
      });
    }

    // Check if feedback exists
    const feedbackDoc = await db.collection('feedback').doc(feedbackId).get();
    if (!feedbackDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    // Update feedback status
    await db.collection('feedback').doc(feedbackId).update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        feedbackId: feedbackId,
        status: status
      }
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status',
      details: error.message
    });
  }
});

// Delete feedback
app.delete('/api/feedback/:id', authenticateAdmin, checkPermission(PERMISSIONS.EDIT_FEEDBACK), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Feedback ID is required'
      });
    }

    // Check if feedback exists
    const feedbackDoc = await db.collection('feedback').doc(id).get();
    if (!feedbackDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    // Delete feedback
    await db.collection('feedback').doc(id).delete();

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feedback',
      details: error.message
    });
  }
});

// Get dashboard stats
app.get('/api/dashboard-stats', authenticateAdmin, checkPermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const [usersSnapshot, formsSnapshot, appointmentsSnapshot, paymentsSnapshot, requestsSnapshot, feedbackSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('taxForms').get(),
      db.collection('appointments').get(),
      db.collection('payments').get(),
      db.collection('supportRequests').get(),
      db.collection('feedback').get()
    ]);
    
    const stats = {
      totalUsers: usersSnapshot.size,
      totalTaxForms: formsSnapshot.size,
      totalAppointments: appointmentsSnapshot.size,
      totalPayments: paymentsSnapshot.size,
      totalSupportRequests: requestsSnapshot.size,
      totalFeedback: feedbackSnapshot.size
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      details: error.message
    });
  }
});

// Delete user
app.delete('/api/users/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete user document
    await db.collection('users').doc(userId).delete();
    
    // Also delete related data (optional - you might want to keep some for audit purposes)
    // Delete user's tax forms
    const taxFormsSnapshot = await db.collection('taxForms').where('userId', '==', userId).get();
    const taxFormDeletes = taxFormsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(taxFormDeletes);
    
    // Delete user's appointments
    const appointmentsSnapshot = await db.collection('appointments').where('userId', '==', userId).get();
    const appointmentDeletes = appointmentsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(appointmentDeletes);
    
    // Delete user's payments
    const paymentsSnapshot = await db.collection('payments').where('userId', '==', userId).get();
    const paymentDeletes = paymentsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(paymentDeletes);
    
    // Delete user's support requests
    const supportRequestsSnapshot = await db.collection('supportRequests').where('userId', '==', userId).get();
    const supportRequestDeletes = supportRequestsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(supportRequestDeletes);
    
    // Delete user's feedback
    const feedbackSnapshot = await db.collection('feedback').where('userId', '==', userId).get();
    const feedbackDeletes = feedbackSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(feedbackDeletes);
    
    res.json({
      success: true,
      message: 'User and all related data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      details: error.message
    });
  }
});

// Delete tax form application
app.delete('/api/tax-forms/:id', authenticateAdmin, checkPermission(PERMISSIONS.DELETE_APPLICATIONS), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tax form ID is required'
      });
    }
    
    console.log(`🗑️ Admin attempting to delete tax form: ${id}`);
    
    // Check if tax form exists
    const taxFormDoc = await db.collection('taxForms').doc(id).get();
    if (!taxFormDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Tax form not found'
      });
    }
    
    const taxFormData = taxFormDoc.data();
    const userId = taxFormData.userId;
    
    console.log(`📋 Tax form found for user: ${userId}`);
    
    // Delete the tax form document
    await db.collection('taxForms').doc(id).delete();
    console.log(`✅ Tax form ${id} deleted successfully`);
    
    // Optional: Also delete related documents from GCS
    // Note: This is optional - you might want to keep documents for audit purposes
    // Uncomment the following section if you want to delete GCS files as well
    
    /*
    try {
      // Get all document references from the tax form
      const documentPaths = [];
      
      // Collect all document paths from various categories
      const categories = [
        'previousYearTaxDocuments',
        'w2Forms', 
        'medicalDocuments',
        'educationDocuments',
        'dependentChildrenDocuments',
        'homeownerDeductionDocuments',
        'personalIdDocuments'
      ];
      
      categories.forEach(category => {
        if (taxFormData[category] && Array.isArray(taxFormData[category])) {
          taxFormData[category].forEach(doc => {
            if (doc.gcsPath) {
              documentPaths.push(doc.gcsPath);
            }
          });
        }
      });
      
      // Delete files from GCS
      if (documentPaths.length > 0) {
        console.log(`🗂️ Deleting ${documentPaths.length} files from GCS...`);
        const deletePromises = documentPaths.map(path => {
          const fileRef = bucket.file(path);
          return fileRef.delete().catch(err => {
            console.warn(`⚠️ Failed to delete file ${path}:`, err.message);
            // Don't throw error - continue with other deletions
          });
        });
        
        await Promise.all(deletePromises);
        console.log(`✅ GCS files deleted successfully`);
      }
    } catch (gcsError) {
      console.warn('⚠️ GCS cleanup failed (continuing with database deletion):', gcsError.message);
      // Don't fail the entire operation if GCS cleanup fails
    }
    */
    
    res.json({
      success: true,
      message: 'Tax form application deleted successfully',
      data: {
        deletedFormId: id,
        userId: userId,
        deletedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting tax form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tax form application',
      details: error.message
    });
  }
});

// Admin file serving endpoints

// Debug endpoint
app.get('/admin/files/debug', (req, res) => {
  res.json({
    message: 'Admin file serving debug endpoint',
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    params: req.params,
    query: req.query
  });
});

// IMPORTANT: Specific routes must come before catch-all routes
// View single file (with decryption for mobile app documents) - MOVED FROM LINE 2080
app.get('/admin/files/view/:gcsPath(*)', authenticateAdmin, async (req, res) => {
  try {
    const gcsPath = req.params.gcsPath;
    
    if (!gcsPath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    console.log(`👁️ Admin viewing file: ${gcsPath}`);
    console.log(`🔍 Raw gcsPath parameter:`, req.params.gcsPath);
    console.log(`🔍 Decoded gcsPath:`, decodeURIComponent(gcsPath));

    const fileRef = bucket.file(gcsPath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check if this is a mobile app document (encrypted) or admin document
    const isMobileAppDocument = !gcsPath.includes('admin-returns');
    
    if (isMobileAppDocument) {
      console.log(`🔐 Viewing mobile app document (checking if encrypted)...`);
      
      // Download the file from GCS
      const [fileBuffer] = await fileRef.download();
      
      // ============================================
      // WEBSITE SUPPORT: Detect if file is encrypted or unencrypted
      // ============================================
      // Website uploads are stored unencrypted (fallback), while mobile app uploads are encrypted
      // Try to parse as JSON to detect encrypted structure
      let isEncrypted = false;
      let encryptedFileData = null;
      
      try {
        const fileString = fileBuffer.toString();
        encryptedFileData = JSON.parse(fileString);
        
        // Check if it has the encrypted data structure
        if (encryptedFileData && 
            encryptedFileData.encryptedData && 
            encryptedFileData.encryptedKey && 
            encryptedFileData.iv) {
          isEncrypted = true;
          console.log(`✅ File is encrypted (mobile app upload)`);
        } else {
          console.log(`⚠️ File parsed as JSON but missing encrypted structure - treating as unencrypted`);
        }
      } catch (parseError) {
        // Not JSON, so it's an unencrypted file (website upload)
        console.log(`📄 File is unencrypted (website upload or raw file)`);
        isEncrypted = false;
      }
      // ============================================
      
      if (isEncrypted) {
        // Mobile app encrypted file - decrypt it
        console.log(`🔓 Decrypting encrypted mobile app document...`);
        
        // Convert base64 strings back to buffers
        const encryptedData = {
          encryptedData: Buffer.from(encryptedFileData.encryptedData, 'base64'),
          encryptedKey: Buffer.from(encryptedFileData.encryptedKey, 'base64'),
          iv: Buffer.from(encryptedFileData.iv, 'base64'),
          algorithm: encryptedFileData.algorithm
        };

        // Decrypt the file using DEK approach
        const decryptedBuffer = await decryptFileWithDEK(encryptedData);
        
        // Get file metadata
        const [metadata] = await fileRef.getMetadata();
        const contentType = metadata.contentType || 'application/octet-stream';
        const originalName = metadata.metadata?.originalName || 'document';

        // Set headers for viewing
        res.set({
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${originalName}"`,
          'Content-Length': decryptedBuffer.length,
          'Cache-Control': 'private, max-age=3600'
        });

        // Send the decrypted file
        res.send(decryptedBuffer);
      } else {
        // Website unencrypted file - stream directly
        console.log(`📄 Streaming unencrypted file (website upload)...`);
        
        // Get file metadata
        const [metadata] = await fileRef.getMetadata();
        const contentType = metadata.contentType || 'application/octet-stream';
        const originalName = metadata.metadata?.originalName || 'document';

        // Set headers for viewing
        res.set({
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${originalName}"`,
          'Cache-Control': 'private, max-age=3600'
        });

        // Stream the file directly from GCS (it's already unencrypted)
        const stream = fileRef.createReadStream();
        stream.pipe(res);
      }
      
    } else {
      console.log(`📄 Viewing admin document directly from GCS`);
      
      // For admin documents, stream directly from GCS
      const [metadata] = await fileRef.getMetadata();
      const contentType = metadata.contentType || 'application/octet-stream';
      const originalName = metadata.metadata?.originalName || 'document';

      // Set headers for viewing
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${originalName}"`,
        'Cache-Control': 'private, max-age=3600'
      });

      // Stream the file directly from GCS
      const stream = fileRef.createReadStream();
      stream.pipe(res);
    }
    
  } catch (error) {
    console.error('Error viewing file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to view file',
      details: error.message
    });
  }
});

// Download single file (with decryption for mobile app documents) - MOVED FROM LINE 2177
app.get('/admin/files/download/:gcsPath(*)', authenticateAdmin, async (req, res) => {
  try {
    const gcsPath = req.params.gcsPath;
    
    if (!gcsPath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    console.log(`📥 Admin downloading file: ${gcsPath}`);
    console.log(`🔍 Raw gcsPath parameter:`, req.params.gcsPath);
    console.log(`🔍 Decoded gcsPath:`, decodeURIComponent(gcsPath));

    const fileRef = bucket.file(gcsPath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check if this is a mobile app document (encrypted) or admin document
    const isMobileAppDocument = !gcsPath.includes('admin-returns');
    
    if (isMobileAppDocument) {
      console.log(`🔐 Downloading mobile app document (checking if encrypted)...`);
      
      // Download the file from GCS
      const [fileBuffer] = await fileRef.download();
      
      // ============================================
      // WEBSITE SUPPORT: Detect if file is encrypted or unencrypted
      // ============================================
      // Website uploads are stored unencrypted (fallback), while mobile app uploads are encrypted
      // Try to parse as JSON to detect encrypted structure
      let isEncrypted = false;
      let encryptedFileData = null;
      
      try {
        const fileString = fileBuffer.toString();
        encryptedFileData = JSON.parse(fileString);
        
        // Check if it has the encrypted data structure
        if (encryptedFileData && 
            encryptedFileData.encryptedData && 
            encryptedFileData.encryptedKey && 
            encryptedFileData.iv) {
          isEncrypted = true;
          console.log(`✅ File is encrypted (mobile app upload)`);
        } else {
          console.log(`⚠️ File parsed as JSON but missing encrypted structure - treating as unencrypted`);
        }
      } catch (parseError) {
        // Not JSON, so it's an unencrypted file (website upload)
        console.log(`📄 File is unencrypted (website upload or raw file)`);
        isEncrypted = false;
      }
      // ============================================
      
      if (isEncrypted) {
        // Mobile app encrypted file - decrypt it
        console.log(`🔓 Decrypting encrypted mobile app document...`);
        
        // Convert base64 strings back to buffers
        const encryptedData = {
          encryptedData: Buffer.from(encryptedFileData.encryptedData, 'base64'),
          encryptedKey: Buffer.from(encryptedFileData.encryptedKey, 'base64'),
          iv: Buffer.from(encryptedFileData.iv, 'base64'),
          algorithm: encryptedFileData.algorithm
        };

        // Decrypt the file using DEK approach
        const decryptedBuffer = await decryptFileWithDEK(encryptedData);
        
        // Get file metadata
        const [metadata] = await fileRef.getMetadata();
        const contentType = metadata.contentType || 'application/octet-stream';
        const originalName = metadata.metadata?.originalName || 'document';

        // Set headers for download
        res.set({
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${originalName}"`,
          'Content-Length': decryptedBuffer.length,
          'Cache-Control': 'private, max-age=3600'
        });

        // Send the decrypted file
        res.send(decryptedBuffer);
      } else {
        // Website unencrypted file - stream directly
        console.log(`📄 Streaming unencrypted file for download (website upload)...`);
        
        // Get file metadata
        const [metadata] = await fileRef.getMetadata();
        const contentType = metadata.contentType || 'application/octet-stream';
        const originalName = metadata.metadata?.originalName || 'document';

        // Set headers for download
        res.set({
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${originalName}"`,
          'Cache-Control': 'private, max-age=3600'
        });

        // Stream the file directly from GCS (it's already unencrypted)
        const stream = fileRef.createReadStream();
        stream.pipe(res);
      }
      
    } else {
      console.log(`📄 Downloading admin document directly from GCS`);
      
      // For admin documents, stream directly from GCS
      const [metadata] = await fileRef.getMetadata();
      const contentType = metadata.contentType || 'application/octet-stream';
      const originalName = metadata.metadata?.originalName || 'document';

      // Set headers for download
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${originalName}"`,
        'Cache-Control': 'private, max-age=3600'
      });

      // Stream the file directly from GCS
      const stream = fileRef.createReadStream();
      stream.pipe(res);
    }
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      details: error.message
    });
  }
});

// Download all files for an application (ZIP archive) - MOVED FROM LINE 2274
app.get('/admin/files/download-all/:applicationId', authenticateAdmin, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    console.log(`📦 Admin downloading all files for application: ${applicationId}`);

    // Get tax form document to find all files
    const taxFormRef = db.collection('taxForms').doc(applicationId);
    const taxFormDoc = await taxFormRef.get();
    
    if (!taxFormDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const taxFormData = taxFormDoc.data();
    const documents = taxFormData.documents || [];
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No documents found for this application'
      });
    }

    console.log(`📁 Found ${documents.length} documents to download`);

    // Create a ZIP file
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Set response headers
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="application-${applicationId}-documents.zip"`,
      'Cache-Control': 'private, max-age=3600'
    });

    // Pipe archive to response
    archive.pipe(res);

    // Process each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const gcsPath = doc.gcsPath;
      
      try {
        console.log(`📥 Processing document ${i + 1}/${documents.length}: ${doc.name}`);
        
        const fileRef = bucket.file(gcsPath);
        const isMobileAppDocument = !gcsPath.includes('admin-returns');
        
        let fileBuffer;
        
        if (isMobileAppDocument) {
          // ============================================
          // WEBSITE SUPPORT: Detect if file is encrypted or unencrypted
          // ============================================
          // Download the file from GCS
          const [downloadedBuffer] = await fileRef.download();
          
          // Try to parse as JSON to detect encrypted structure
          let isEncrypted = false;
          let encryptedFileData = null;
          
          try {
            const fileString = downloadedBuffer.toString();
            encryptedFileData = JSON.parse(fileString);
            
            // Check if it has the encrypted data structure
            if (encryptedFileData && 
                encryptedFileData.encryptedData && 
                encryptedFileData.encryptedKey && 
                encryptedFileData.iv) {
              isEncrypted = true;
            }
          } catch (parseError) {
            // Not JSON, so it's an unencrypted file (website upload)
            isEncrypted = false;
          }
          
          if (isEncrypted) {
            // Mobile app encrypted file - decrypt it
            const encryptedData = {
              encryptedData: Buffer.from(encryptedFileData.encryptedData, 'base64'),
              encryptedKey: Buffer.from(encryptedFileData.encryptedKey, 'base64'),
              iv: Buffer.from(encryptedFileData.iv, 'base64'),
              algorithm: encryptedFileData.algorithm
            };
            fileBuffer = await decryptFileWithDEK(encryptedData);
          } else {
            // Website unencrypted file - use directly
            fileBuffer = downloadedBuffer;
          }
          // ============================================
        } else {
          // Download admin document directly
          const [buffer] = await fileRef.download();
          fileBuffer = buffer;
        }
        
        // Add file to ZIP with proper name
        const fileName = `${doc.category || 'misc'}/${doc.name}`;
        archive.append(fileBuffer, { name: fileName });
        
      } catch (error) {
        console.error(`❌ Error processing document ${doc.name}:`, error);
        // Continue with other documents even if one fails
        archive.append(`Error loading ${doc.name}: ${error.message}`, { name: `errors/${doc.name}.txt` });
      }
    }

    // Finalize the archive
    await archive.finalize();
    
    console.log(`✅ ZIP archive created successfully for application ${applicationId}`);

  } catch (error) {
    console.error('Error creating download all archive:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create download archive',
      details: error.message
    });
  }
});

// Catch-all route for other file operations (MUST come after specific routes)
app.get('/admin/files/*', authenticateAdmin, async (req, res) => {
  // Check if this is a download request by looking for /download in the path
  if (req.params[0].includes('/download')) {
    try {
      // Get the full path after /admin/files/ and before /download
      const fullPath = req.params[0];
      const gcsPath = fullPath.replace(/\/download$/, '');
    
      console.log('🔍 Full path received:', fullPath);
      console.log('🔍 GCS path after processing:', gcsPath);
      
      if (!gcsPath) {
        return res.status(400).json({
          success: false,
          error: 'File path is required'
        });
      }

      // Decode the URL-encoded path
      const decodedPath = decodeURIComponent(gcsPath);
      console.log('🔍 Download file path:', decodedPath);
      
      const fileRef = bucket.file(decodedPath);
      
      // Check if file exists
      const [exists] = await fileRef.exists();
      if (!exists) {
        console.log('❌ File not found:', decodedPath);
        return res.status(404).json({
          success: false,
          error: 'File not found',
          path: decodedPath
        });
      }
      
      console.log('✅ File found, downloading:', decodedPath);

      // Get file metadata
      const [metadata] = await fileRef.getMetadata();
      
      // Set download headers
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${metadata.metadata?.originalName || 'download'}"`,
        'Cache-Control': 'private, max-age=3600',
      });

      // Stream the file
      const stream = fileRef.createReadStream();
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('File download error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download file'
          });
        }
      });

    } catch (error) {
      console.error('Admin file download error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download file',
        details: error.message
      });
    }
  } else {
    // This is a regular file view request, not a download
    try {
      // Get the full path after /admin/files/
      const gcsPath = req.params[0];

      if (!gcsPath) {
        return res.status(400).json({
          success: false,
          error: 'File path is required'
        });
      }

      // Decode the URL-encoded path
      const decodedPath = decodeURIComponent(gcsPath);
      console.log('🔍 Requested file path:', decodedPath);

      const fileRef = bucket.file(decodedPath);

      // Check if file exists
      const [exists] = await fileRef.exists();
      if (!exists) {
        console.log('❌ File not found:', decodedPath);
        return res.status(404).json({
          success: false,
          error: 'File not found',
          path: decodedPath
        });
      }

      console.log('✅ File found, streaming:', decodedPath);

      // Get file metadata
      const [metadata] = await fileRef.getMetadata();

      // Set appropriate headers
      res.set({
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${metadata.metadata?.originalName || 'file'}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      });

      // Stream the file
      const stream = fileRef.createReadStream();
      stream.pipe(res);

      stream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to stream file'
          });
        }
      });

    } catch (error) {
      console.error('Admin file access error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to access file',
        details: error.message
      });
    }
  }
});


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Admin Panel Backend is running!',
    status: 'success',
    version: '1.0.0',
    security: 'Protected with JWT authentication, rate limiting, and input validation',
    endpoints: {
      auth: [
        'POST /api/auth/login - Admin login',
        'POST /api/auth/refresh - Refresh access token',
        'POST /api/auth/logout - Admin logout'
      ],
      public: [
        'GET /health - Health check',
        'GET / - Root endpoint'
      ],
      protected: [
        'GET /api/users - Get all users',
        'DELETE /api/users/:userId - Delete user and all related data',
        'GET /api/tax-forms - Get all tax forms',
        'DELETE /api/tax-forms/:id - Delete tax form application',
        'GET /api/appointments - Get all appointments',
        'PUT /api/appointments/status - Update appointment status',
        'PUT /api/appointments/reschedule - Reschedule appointment',
        'PUT /api/appointments/notes - Update admin notes',
        'DELETE /api/appointments/:id - Delete appointment',
        'GET /api/appointments/stats - Get appointment statistics',
        'GET /api/payments - Get all payments',
        'GET /api/support-requests - Get all support requests',
        'GET /api/feedback - Get all feedback',
        'POST /api/feedback/reply - Reply to feedback',
        'PUT /api/feedback/status - Update feedback status',
        'DELETE /api/feedback/:id - Delete feedback',
        'GET /api/dashboard-stats - Get dashboard statistics'
      ]
    }
  });
});

// Admin file upload endpoints
app.post('/admin/upload/return', upload.single('file'), authenticateAdmin, async (req, res) => {
  try {
    console.log('📁 Admin upload request received');
    console.log('📁 Request body:', req.body);
    console.log('📁 File:', req.file ? 'Present' : 'Missing');
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { applicationId, returnType } = req.body; // returnType: 'draft' or 'final'
    
    if (!applicationId || !returnType) {
      return res.status(400).json({
        success: false,
        error: 'applicationId and returnType are required'
      });
    }

    if (!['draft', 'final'].includes(returnType)) {
      return res.status(400).json({
        success: false,
        error: 'returnType must be either "draft" or "final"'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop() || 'bin';
    const fileName = `admin-returns/${applicationId}/${returnType}-${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    
    console.log(`📁 Admin uploading ${returnType} return for application ${applicationId}`);
    console.log(`📁 Generated filename: ${fileName}`);
    
    // Encrypt the file using DEK approach
    console.log('🔐 Encrypting file with DEK approach...');
    const encryptedFileData = await encryptFileWithDEK(req.file.buffer);
    console.log('✅ File encrypted successfully with DEK');
    console.log('🔍 Encrypted data structure:', {
      hasEncryptedData: !!encryptedFileData.encryptedData,
      hasEncryptedKey: !!encryptedFileData.encryptedKey,
      hasIv: !!encryptedFileData.iv,
      algorithm: encryptedFileData.algorithm
    });
    
    // Convert encrypted data to a single buffer for storage
    const encryptedBuffer = Buffer.concat([
      Buffer.from(JSON.stringify({
        encryptedData: encryptedFileData.encryptedData ? encryptedFileData.encryptedData.toString('base64') : '',
        encryptedKey: encryptedFileData.encryptedKey ? encryptedFileData.encryptedKey.toString('base64') : '',
        iv: encryptedFileData.iv ? encryptedFileData.iv.toString('base64') : '',
        algorithm: encryptedFileData.algorithm || 'aes-256-cbc'
      }))
    ]);
    
    // Create file reference in bucket
    const fileRef = bucket.file(fileName);
    
    // Upload options
    const uploadOptions = {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          applicationId: applicationId,
          returnType: returnType,
          uploadedBy: req.admin.email || 'admin',
          uploadedAt: new Date().toISOString(),
        },
      },
      resumable: true,
      validation: 'crc32c',
    };

    // Create upload stream
    const stream = fileRef.createWriteStream(uploadOptions);
    
    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload stream error:', error);
        res.status(500).json({
          success: false,
          error: 'Upload failed',
          details: error.message
        });
        reject(error);
      });
      
      stream.on('finish', async () => {
        try {
          console.log(`✅ Admin ${returnType} return uploaded successfully to GCS: ${fileName}`);
          
          // Generate signed URL for the uploaded file
          const [signedUrl] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
          });
          
          console.log(`✅ Generated signed URL for admin return: ${fileName}`);
          
          // Update the tax form document in database
          try {
            const taxFormRef = db.collection('taxForms').doc(applicationId);
            const taxFormDoc = await taxFormRef.get();
            
            if (taxFormDoc.exists) {
              const updateData = {};
              updateData[`${returnType}Return`] = {
                fileName: fileName,
                originalName: req.file.originalname,
                gcsPath: fileName,
                publicUrl: signedUrl,
                size: req.file.size,
                contentType: req.file.mimetype,
                uploadedAt: new Date().toISOString(),
                uploadedBy: req.admin.email || 'admin'
              };
              
              await taxFormRef.update(updateData);
              console.log(`✅ Updated tax form with ${returnType} return reference`);
            }
          } catch (dbError) {
            console.warn(`⚠️ Could not update database: ${dbError.message}`);
            // Don't fail the upload if database update fails
          }
          
          res.json({
            success: true,
            message: `${returnType} return uploaded successfully`,
            fileName: fileName,
            gcsPath: fileName,
            publicUrl: signedUrl,
            size: req.file.size,
            contentType: req.file.mimetype,
            uploadedAt: new Date().toISOString()
          });
          resolve();
        } catch (error) {
          console.error('Error completing admin upload:', error);
          res.status(500).json({
            success: false,
            error: 'File uploaded but failed to complete processing',
            details: error.message
          });
          reject(error);
        }
      });
      
      // Write the encrypted buffer to the stream
      stream.end(encryptedBuffer);
    });
  } catch (error) {
    console.error('Error in admin file upload:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      details: error.message
    });
  }
});

// Get admin uploaded returns for an application
app.get('/admin/returns/:applicationId', authenticateAdmin, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    // Get tax form document
    const taxFormRef = db.collection('taxForms').doc(applicationId);
    const taxFormDoc = await taxFormRef.get();
    
    if (!taxFormDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const taxFormData = taxFormDoc.data();
    const returns = {};

    // Check for draft return
    if (taxFormData.draftReturn) {
      // Generate fresh signed URL for draft return
      try {
        const fileRef = bucket.file(taxFormData.draftReturn.gcsPath);
        const [signedUrl] = await fileRef.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
        });
        returns.draftReturn = {
          ...taxFormData.draftReturn,
          publicUrl: signedUrl
        };
      } catch (error) {
        console.warn('Could not generate signed URL for draft return:', error);
        returns.draftReturn = taxFormData.draftReturn;
      }
    }

    // Check for final return
    if (taxFormData.finalReturn) {
      // Generate fresh signed URL for final return
      try {
        const fileRef = bucket.file(taxFormData.finalReturn.gcsPath);
        const [signedUrl] = await fileRef.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
        });
        returns.finalReturn = {
          ...taxFormData.finalReturn,
          publicUrl: signedUrl
        };
      } catch (error) {
        console.warn('Could not generate signed URL for final return:', error);
        returns.finalReturn = taxFormData.finalReturn;
      }
    }

    res.json({
      success: true,
      data: returns
    });
  } catch (error) {
    console.error('Error getting admin returns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get returns',
      details: error.message
    });
  }
});

// Download admin uploaded return (encrypted file)
app.get('/admin/returns/:applicationId/:returnType', authenticateAdmin, async (req, res) => {
  try {
    const { applicationId, returnType } = req.params;
    
    if (!applicationId || !returnType) {
      return res.status(400).json({
        success: false,
        error: 'Application ID and return type are required'
      });
    }

    if (!['draft', 'final'].includes(returnType)) {
      return res.status(400).json({
        success: false,
        error: 'Return type must be either "draft" or "final"'
      });
    }

    // Get tax form document
    const taxFormRef = db.collection('taxForms').doc(applicationId);
    const taxFormDoc = await taxFormRef.get();
    
    if (!taxFormDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const taxFormData = taxFormDoc.data();
    const returnData = taxFormData[`${returnType}Return`];
    
    if (!returnData) {
      return res.status(404).json({
        success: false,
        error: `${returnType} return not found`
      });
    }

    // Generate signed URL for download
    const fileRef = bucket.file(returnData.gcsPath);
    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
    });

    res.json({
      success: true,
      downloadUrl: signedUrl,
      fileName: returnData.originalName,
      contentType: returnData.contentType,
      size: returnData.size
    });
  } catch (error) {
    console.error('Error downloading admin return:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download return',
      details: error.message
    });
  }
});

// View admin uploaded return (decrypted file)
app.get('/admin/returns/:applicationId/:returnType/view', authenticateAdmin, async (req, res) => {
  try {
    const { applicationId, returnType } = req.params;
    
    if (!applicationId || !returnType) {
      return res.status(400).json({
        success: false,
        error: 'Application ID and return type are required'
      });
    }

    if (!['draft', 'final'].includes(returnType)) {
      return res.status(400).json({
        success: false,
        error: 'Return type must be either "draft" or "final"'
      });
    }

    console.log(`🔓 Admin viewing ${returnType} return for application ${applicationId}`);

    // Get tax form document
    const taxFormRef = db.collection('taxForms').doc(applicationId);
    const taxFormDoc = await taxFormRef.get();
    
    if (!taxFormDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const taxFormData = taxFormDoc.data();
    const returnData = taxFormData[`${returnType}Return`];
    
    console.log(`🔍 View endpoint - Tax form data for ${returnType}Return:`, {
      hasReturnData: !!returnData,
      originalName: returnData?.originalName,
      gcsPath: returnData?.gcsPath,
      uploadedAt: returnData?.uploadedAt
    });
    
    if (!returnData) {
      return res.status(404).json({
        success: false,
        error: `${returnType} return not found`
      });
    }

    console.log(`📁 Downloading encrypted file from GCS: ${returnData.gcsPath}`);

    // Download the encrypted file from GCS
    const fileRef = bucket.file(returnData.gcsPath);
    const [encryptedBuffer] = await fileRef.download();
    
    console.log(`✅ Downloaded encrypted file, size: ${encryptedBuffer.length} bytes`);

    // Parse the encrypted data structure
    const encryptedDataString = encryptedBuffer.toString();
    const encryptedFileData = JSON.parse(encryptedDataString);
    
    console.log(`🔍 Parsed encrypted data structure:`, {
      hasEncryptedData: !!encryptedFileData.encryptedData,
      hasEncryptedKey: !!encryptedFileData.encryptedKey,
      hasIv: !!encryptedFileData.iv,
      algorithm: encryptedFileData.algorithm
    });

    // Convert base64 strings back to buffers
    const encryptedData = {
      encryptedData: Buffer.from(encryptedFileData.encryptedData, 'base64'),
      encryptedKey: Buffer.from(encryptedFileData.encryptedKey, 'base64'),
      iv: Buffer.from(encryptedFileData.iv, 'base64'),
      algorithm: encryptedFileData.algorithm
    };

    console.log(`🔓 Decrypting file with DEK approach...`);

    // Decrypt the file using DEK approach
    const decryptedBuffer = await decryptFileWithDEK(encryptedData);
    
    console.log(`✅ File decrypted successfully, size: ${decryptedBuffer.length} bytes`);

    // Set appropriate headers for viewing
    res.set({
      'Content-Type': returnData.contentType || 'application/pdf',
      'Content-Disposition': `inline; filename="${returnData.originalName}"`,
      'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      'Content-Length': decryptedBuffer.length
    });

    // Send the decrypted file
    res.send(decryptedBuffer);

  } catch (error) {
    console.error('Error viewing admin return:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to view return',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Admin Panel Backend API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Network access: http://192.168.1.34:${PORT}`);
  console.log(`📱 Admin Panel Frontend should connect to: http://localhost:${PORT}`);
  
  // Test KMS connection on startup
  console.log('\n🔐 Testing KMS connection...');
  const kmsTestResult = await testKMSConnection();
  if (kmsTestResult) {
    console.log('✅ KMS is ready for encryption!');
  } else {
    console.log('❌ KMS connection failed - encryption will not work');
  }
  console.log('');
});
