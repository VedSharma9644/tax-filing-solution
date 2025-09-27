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

const app = express();
const PORT = process.env.PORT || 5001;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'admin-panel-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Admin credentials (in production, store in environment variables)
const ADMIN_CREDENTIALS = {
  email: 'admin@taxfiling.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
  name: 'Admin User',
  role: 'admin'
};

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');

// Initialize GCS/KMS Service Account (different from Firebase)
const gcsServiceAccount = require('../../TaxFilingApp/gcs-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tax-filing-app-3649f'
});

const db = admin.firestore();

// Initialize Google Cloud Storage
const storage = new Storage({ 
  projectId: 'tax-filing-app-472019', 
  credentials: gcsServiceAccount 
});
const BUCKET_NAME = 'tax-filing-documents-tax-filing-app-472019';
const bucket = storage.bucket(BUCKET_NAME);

// Initialize KMS
console.log('🔧 Initializing KMS Client...');
console.log('  - Service Account Project:', gcsServiceAccount.project_id);
console.log('  - Service Account Email:', gcsServiceAccount.client_email);
console.log('  - KMS Project ID:', 'tax-filing-app-472019');

const kmsClient = new KeyManagementServiceClient({
  credentials: gcsServiceAccount,
  projectId: 'tax-filing-app-472019'
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
const PROJECT_ID = 'tax-filing-app-472019';
const KEY_RING_ID = 'tax-filing-keys';
const KEY_ID = 'file-encryption-key';
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
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
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

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    req.admin = decoded;
    next();
  });
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

// Authentication endpoints
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateInput
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check admin credentials
    if (email !== ADMIN_CREDENTIALS.email) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isValidPassword = await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { 
        adminId: 'admin-001',
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        role: ADMIN_CREDENTIALS.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { 
        adminId: 'admin-001',
        email: ADMIN_CREDENTIALS.email,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        admin: {
          id: 'admin-001',
          email: ADMIN_CREDENTIALS.email,
          name: ADMIN_CREDENTIALS.name,
          role: ADMIN_CREDENTIALS.role
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

    jwt.verify(refreshToken, JWT_SECRET, (err, decoded) => {
      if (err || decoded.type !== 'refresh') {
        return res.status(403).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { 
          adminId: decoded.adminId,
          email: decoded.email,
          name: ADMIN_CREDENTIALS.name,
          role: ADMIN_CREDENTIALS.role
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

// Get all users
app.get('/api/users', authenticateAdmin, async (req, res) => {
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
app.get('/api/tax-forms', authenticateAdmin, async (req, res) => {
  try {
    const formsSnapshot = await db.collection('taxForms').get();
    const forms = [];
    
    formsSnapshot.forEach(doc => {
      forms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
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
app.get('/api/tax-forms/:id', authenticateAdmin, async (req, res) => {
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
      // Ensure documents have proper structure
      documents: taxFormData.documents || [],
      // Ensure dependents have proper structure
      dependents: taxFormData.dependents || []
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
app.put('/api/tax-forms/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, expectedReturn, adminNotes } = req.body;
    
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
    const validStatuses = ['submitted', 'under_review', 'approved', 'rejected', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: submitted, under_review, approved, rejected, completed'
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
    
    // Update tax form
    await db.collection('taxForms').doc(id).update(updateData);
    
    res.json({
      success: true,
      message: 'Tax form updated successfully',
      data: {
        id: id,
        status: status || taxFormDoc.data().status,
        expectedReturn: expectedReturn !== undefined ? updateData.expectedReturn : taxFormDoc.data().expectedReturn,
        adminNotes: updateData.adminNotes || taxFormDoc.data().adminNotes
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
app.get('/api/appointments', authenticateAdmin, async (req, res) => {
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
app.put('/api/appointments/status', authenticateAdmin, async (req, res) => {
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
app.put('/api/appointments/reschedule', authenticateAdmin, async (req, res) => {
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
app.put('/api/appointments/notes', authenticateAdmin, async (req, res) => {
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
app.delete('/api/appointments/:id', authenticateAdmin, async (req, res) => {
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
app.get('/api/payments', authenticateAdmin, async (req, res) => {
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
app.get('/api/support-requests', authenticateAdmin, async (req, res) => {
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
app.get('/api/feedback', authenticateAdmin, async (req, res) => {
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
app.post('/api/feedback/reply', authenticateAdmin, async (req, res) => {
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
app.put('/api/feedback/status', authenticateAdmin, async (req, res) => {
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
app.delete('/api/feedback/:id', authenticateAdmin, async (req, res) => {
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
app.get('/api/dashboard-stats', authenticateAdmin, async (req, res) => {
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


// Download file (with authentication) - handle downloads with query parameter
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
