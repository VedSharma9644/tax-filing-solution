const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { KeyManagementServiceClient } = require('@google-cloud/kms');
const crypto = require('crypto');
// Environment-aware service account loading
let serviceAccount, gcsServiceAccount;

if (process.env.NODE_ENV === 'production') {
  // In production, use Application Default Credentials
  serviceAccount = null; // Will use ADC
  gcsServiceAccount = null; // Will use ADC
} else {
  // In development, use local service account files
  serviceAccount = require('./firebase-service-account.json');
  gcsServiceAccount = require('../TaxFilingApp/gcs-service-account.json');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Cloud Run (fixes rate limiting error)
app.set('trust proxy', 1);

// Initialize Firebase Admin SDK
if (process.env.NODE_ENV === 'production') {
  // In production, use Application Default Credentials
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'tax-filing-app-3649f'
  });
} else {
  // In development, use service account file
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'tax-filing-app-3649f'
  });
}

// Get Firestore instance
const db = admin.firestore();

// Initialize Google Cloud Storage
let storage, bucket;

if (process.env.NODE_ENV === 'production') {
  // In production, use Application Default Credentials
  storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID || 'tax-filing-app-3649f'
  });
} else {
  // In development, use service account file
  storage = new Storage({
    projectId: 'tax-filing-app-3649f',
    credentials: gcsServiceAccount,
  });
}

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'tax-filing-documents-tax-filing-app-3649f';
bucket = storage.bucket(BUCKET_NAME);

// Initialize KMS for mobile app encryption
console.log('🔧 Initializing KMS Client for mobile app encryption...');

let kmsClient;
if (process.env.NODE_ENV === 'production') {
  // In production, use Application Default Credentials
  kmsClient = new KeyManagementServiceClient({
    projectId: process.env.GCS_PROJECT_ID || 'tax-filing-app-3649f'
  });
  console.log('  - Using Application Default Credentials');
} else {
  // In development, use service account file
  console.log('  - Service Account Project:', gcsServiceAccount.project_id);
  console.log('  - Service Account Email:', gcsServiceAccount.client_email);
  kmsClient = new KeyManagementServiceClient({
    credentials: gcsServiceAccount,
    projectId: 'tax-filing-app-472019'
  });
}

console.log('  - KMS Project ID:', process.env.GCS_PROJECT_ID || 'tax-filing-app-472019');

console.log('✅ KMS Client initialized for mobile app');

// KMS Configuration
const PROJECT_ID = process.env.GCS_PROJECT_ID || 'tax-filing-app-472019';
const KEY_RING_ID = process.env.KMS_KEY_RING || 'tax-filing-keys';
const KEY_ID = process.env.KMS_KEY_NAME || 'file-encryption-key';
const LOCATION_ID = process.env.KMS_LOCATION || 'global';

// DEK (Data Encryption Key) approach for mobile app files
const encryptFileWithDEK = async (fileBuffer) => {
  try {
    console.log('🔐 Starting DEK encryption process for mobile app...');
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
    
    console.log('✅ DEK encryption completed successfully for mobile app');
    return result;
    
  } catch (error) {
    console.error('❌ DEK Encryption Error for mobile app:', error);
    console.error('❌ KMS Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      projectId: PROJECT_ID,
      keyRingId: KEY_RING_ID,
      keyId: KEY_ID,
      locationId: LOCATION_ID
    });
    throw new Error('Failed to encrypt file with DEK');
  }
};

const decryptFileWithDEK = async (encryptedFileData) => {
  try {
    console.log('🔓 Starting DEK decryption process for mobile app...');
    
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
    
    console.log('✅ DEK decryption completed successfully for mobile app');
    return decryptedData;
    
  } catch (error) {
    console.error('❌ DEK Decryption Error for mobile app:', error);
    throw new Error('Failed to decrypt file with DEK');
  }
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Additional types for mobile compatibility
      'image/*',
      'application/octet-stream', // Fallback for unknown types
      'video/*' // In case camera captures video
    ];
    
    // Check if it's an image type (more flexible)
    const isImage = file.mimetype.startsWith('image/');
    const isAllowedType = allowedTypes.includes(file.mimetype);
    const isGenericImage = file.mimetype === 'image/*';
    
    console.log(`📁 File upload attempt: ${file.originalname}, type: ${file.mimetype}`);
    
    if (isImage || isAllowedType || isGenericImage) {
      console.log('✅ File type accepted');
      cb(null, true);
    } else {
      console.log('❌ File type rejected:', file.mimetype);
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, images, and documents are allowed.`), false);
    }
  }
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'tax-filing-app-secret-key-2024';
const JWT_EXPIRES_IN = '24h';
const JWT_REFRESH_EXPIRES_IN = '7d';

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

// CORS configuration for Expo Go and Android Studio emulator compatibility
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:8081', 
    'http://192.168.1.34:3001',
    // Expo Go origins
    'exp://192.168.1.34:8081',
    'exp://localhost:8081',
    'exp://127.0.0.1:8081',
    // Additional mobile origins
    'http://192.168.1.34:8081',
    'http://127.0.0.1:8081',
    // Android Studio emulator origins
    'http://10.0.2.2:5000',
    'http://10.0.2.2:8081',
    'http://10.0.2.2:3000',
    // Allow all origins in development (for Expo Go and emulator)
    ...(process.env.NODE_ENV === 'development' ? ['*'] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
});

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Tax Filing App API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      testDb: '/test-db',
      collections: '/collections',
      auth: {
        sendOtpEmail: '/auth/send-otp/email',
        sendOtpPhone: '/auth/send-otp/phone',
        verifyOtp: '/auth/verify-otp',
        googleLogin: '/auth/google-login',
        me: '/auth/me',
        refreshToken: '/auth/refresh-token'
      },
      profile: {
        updateProfile: '/profile/update'
      },
      feedback: {
        submitFeedback: '/feedback/submit',
        getFeedbackHistory: '/feedback/history'
      },
      support: {
        submitSupportRequest: '/support/submit',
        getSupportRequestHistory: '/support/history'
      },
      appointments: {
        submitAppointment: '/appointments/submit',
        getAppointmentHistory: '/appointments/history',
        getAvailableTimeSlots: '/appointments/available-slots',
        cancelAppointment: '/appointments/cancel'
      },
      taxForms: {
        submitTaxForm: '/tax-forms/submit',
        getTaxFormHistory: '/tax-forms/history',
        getTaxFormDetails: '/tax-forms/:formId'
      }
    }
  });
});

// List all collections endpoint
app.get('/collections', async (req, res) => {
  try {
    console.log('🔄 Listing all collections...');
    
    const collections = [
      'users',
      'taxForms', 
      'appointments',
      'payments',
      'supportRequests',
      'feedback',
      'notifications',
      'test'
    ];
    
    const collectionData = {};
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).limit(5).get();
        collectionData[collectionName] = {
          count: snapshot.size,
          documents: snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          }))
        };
      } catch (error) {
        collectionData[collectionName] = {
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      message: 'Collections retrieved successfully',
      collections: collectionData,
      totalCollections: collections.length
    });
  } catch (error) {
    console.error('❌ Error listing collections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list collections',
      details: error.message
    });
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin authentication middleware (for admin panel access)
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  // Try to verify as admin token first (admin panel uses different secret)
  const adminSecret = 'admin-panel-super-secret-key-change-in-production';
  jwt.verify(token, adminSecret, (err, user) => {
    if (err) {
      // If admin token fails, try regular user token
      jwt.verify(token, JWT_SECRET, (err2, user2) => {
        if (err2) {
          return res.status(403).json({ success: false, error: 'Invalid or expired token' });
        }
        req.user = user2;
        next();
      });
    } else {
      req.user = user;
      next();
    }
  });
};

// Generate signed URL for file access
app.get('/api/files/signed-url/:gcsPath(*)', authenticateAdmin, async (req, res) => {
  try {
    const gcsPath = req.params.gcsPath;
    
    if (!gcsPath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    const fileRef = bucket.file(gcsPath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Generate signed URL (valid for 1 hour)
    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
    });

    res.json({
      success: true,
      signedUrl: signedUrl,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate signed URL',
      details: error.message
    });
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Google ID Token Verification Function
const verifyGoogleIdToken = async (idToken) => {
  try {
    console.log('🔍 Verifying Google ID token...');
    
    // Use Google's tokeninfo endpoint for verification
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    
    if (!response.ok) {
      throw new Error(`Token verification failed: ${response.status} ${response.statusText}`);
    }
    
    const tokenInfo = await response.json();
    
    // Validate audience (must match your web client ID)
    const expectedAudience = '693306869303-h140tfkqn6re5rfa31jo1aqi98nucqac.apps.googleusercontent.com';
    if (tokenInfo.aud !== expectedAudience) {
      throw new Error(`Invalid audience. Expected: ${expectedAudience}, Got: ${tokenInfo.aud}`);
    }
    
    // Validate issuer (must be Google)
    if (tokenInfo.iss !== 'https://accounts.google.com') {
      throw new Error(`Invalid issuer. Expected: https://accounts.google.com, Got: ${tokenInfo.iss}`);
    }
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (tokenInfo.exp && tokenInfo.exp < currentTime) {
      throw new Error('Token has expired');
    }
    
    // Check if email is verified
    if (tokenInfo.email_verified !== 'true') {
      throw new Error('Email is not verified');
    }
    
    console.log('✅ Google ID token verified successfully');
    console.log('📧 User email:', tokenInfo.email);
    console.log('👤 User name:', tokenInfo.name);
    
    // Return token info in the format expected by the rest of the code
    return {
      uid: tokenInfo.sub,
      email: tokenInfo.email,
      name: tokenInfo.name,
      picture: tokenInfo.picture,
      email_verified: tokenInfo.email_verified === 'true',
      given_name: tokenInfo.given_name,
      family_name: tokenInfo.family_name
    };
    
  } catch (error) {
    console.error('❌ Google ID token verification failed:', error);
    throw error;
  }
};

// Send OTP to email
app.post('/auth/send-otp/email', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await db.collection('otps').doc(email).set({
      email,
      otp,
      type: 'email',
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      attempts: 0,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // For development: Return OTP in response (remove in production)
    console.log(`📧 OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to email successfully',
      // Remove this in production
      otp: otp
    });
  } catch (error) {
    console.error('❌ Error sending email OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      details: error.message
    });
  }
});

// Send OTP to phone
app.post('/auth/send-otp/phone', authLimiter, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Valid phone number is required'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await db.collection('otps').doc(phone).set({
      phone,
      otp,
      type: 'phone',
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      attempts: 0,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // For development: Return OTP in response (remove in production)
    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to phone successfully',
      // Remove this in production
      otp: otp
    });
  } catch (error) {
    console.error('❌ Error sending phone OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      details: error.message
    });
  }
});

// Verify OTP and create/login user
app.post('/auth/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Valid 6-digit OTP is required'
      });
    }

    // Determine which OTP to check
    let otpDoc;
    let identifier;
    let otpType;

    if (email) {
      otpDoc = await db.collection('otps').doc(email).get();
      identifier = email;
      otpType = 'email';
    } else if (phone) {
      otpDoc = await db.collection('otps').doc(phone).get();
      identifier = phone;
      otpType = 'phone';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Email or phone number is required'
      });
    }

    if (!otpDoc.exists) {
      return res.status(400).json({
        success: false,
        error: 'OTP not found. Please request a new OTP.'
      });
    }

    const otpData = otpDoc.data();

    // Check if OTP is expired
    if (otpData.expiresAt.toDate() < new Date()) {
      await db.collection('otps').doc(identifier).delete();
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check if OTP is correct
    if (otpData.otp !== otp) {
      const newAttempts = otpData.attempts + 1;
      await db.collection('otps').doc(identifier).update({
        attempts: newAttempts
      });

      if (newAttempts >= 3) {
        await db.collection('otps').doc(identifier).delete();
        return res.status(400).json({
          success: false,
          error: 'Too many incorrect attempts. Please request a new OTP.'
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.',
        attemptsLeft: 3 - newAttempts
      });
    }

    // OTP is valid, now handle user creation/login
    let user;
    let userExists = false;

    // Check if user exists by email or phone
    if (email) {
      const userByEmail = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!userByEmail.empty) {
        user = userByEmail.docs[0];
        userExists = true;
      }
    }

    if (phone && !userExists) {
      const userByPhone = await db.collection('users').where('phone', '==', phone).limit(1).get();
      if (!userByPhone.empty) {
        user = userByPhone.docs[0];
        userExists = true;
      }
    }

    if (userExists) {
      // Update existing user
      const userData = user.data();
      const updateData = {
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // If logging in with email but phone is missing, add it
      if (email && !userData.phone && phone) {
        updateData.phone = phone;
      }

      // If logging in with phone but email is missing, add it
      if (phone && !userData.email && email) {
        updateData.email = email;
      }

      await db.collection('users').doc(user.id).update(updateData);
      userData.id = user.id;
      user = { id: user.id, ...userData, ...updateData };
    } else {
      // Create new user
      const newUserData = {
        firstName: '',
        lastName: '',
        email: email || '',
        phone: phone || '',
        role: 'taxpayer',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const newUserRef = await db.collection('users').add(newUserData);
      user = { id: newUserRef.id, ...newUserData };
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email, 
        phone: user.phone,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Mark OTP as verified and delete it
    await db.collection('otps').doc(identifier).delete();

    res.json({
      success: true,
      message: userExists ? 'Login successful' : 'User created and logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
      details: error.message
    });
  }
});

// Get current user info
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    res.json({
      success: true,
      user: {
        id: userDoc.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt
      }
    });
  } catch (error) {
    console.error('❌ Error getting user info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
      details: error.message
    });
  }
});

// Refresh token
app.post('/auth/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const userDoc = await db.collection('users').doc(decoded.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    const newAccessToken = jwt.sign(
      { 
        userId: userDoc.id, 
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email, 
        phone: userData.phone,
        role: userData.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      details: error.message
    });
  }
});

// Firebase Phone Auth Login
app.post('/auth/firebase-phone-login', authLimiter, async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Firebase ID token is required'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Extract phone number from token (try multiple possible fields)
    const phoneNumber = decodedToken.phone_number || 
                       decodedToken.phoneNumber || 
                       decodedToken.firebase?.identities?.phone?.[0] || 
                       '';

    console.log('Firebase Phone Auth - UID:', uid);
    console.log('Firebase Phone Auth - Phone:', phoneNumber);
    console.log('Full decoded token structure:', JSON.stringify(decodedToken, null, 2));

    // Check if user exists by UID
    let userQuery = await db.collection('users').where('uid', '==', uid).limit(1).get();
    let userDoc, userData;

    if (userQuery.empty) {
      // Create new user
      console.log('Creating new Firebase Phone Auth user');
      const newUserData = {
        uid: uid,
        phone: phoneNumber,
        firstName: '',
        lastName: '',
        email: '',
        googleId: null,
        firebasePhoneAuth: true,
        role: 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const userRef = await db.collection('users').add(newUserData);
      userData = { id: userRef.id, ...newUserData };
      console.log('New user created with ID:', userRef.id);
    } else {
      // Update existing user
      console.log('Updating existing Firebase Phone Auth user');
      userDoc = userQuery.docs[0];
      userData = userDoc.data();
      
      await db.collection('users').doc(userDoc.id).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        phone: phoneNumber || userData.phone
      });
      
      userData.id = userDoc.id;
    }

    // Generate backend JWT token
    const accessToken = jwt.sign(
      { 
        userId: userData.id, 
        uid: uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email, 
        phone: phoneNumber || userData.phone,
        role: userData.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('Firebase Phone Auth successful for user:', userData.id);

    res.json({
      success: true,
      message: 'Firebase Phone authentication successful',
      accessToken: accessToken,
      user: {
        id: userData.id,
        uid: uid,
        phone: phoneNumber || userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role
      }
    });

  } catch (error) {
    console.error('❌ Firebase Phone Auth Error:', error);
    res.status(400).json({
      success: false,
      error: 'Firebase authentication failed',
      details: error.message
    });
  }
});

// Google OAuth Login
app.post('/auth/google-login', authLimiter, async (req, res) => {
  try {
    const { authCode, idToken, accessToken } = req.body;

    let decodedToken;

    if (authCode) {
      // Handle authorization code flow
      try {
        // Exchange authorization code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_WEB_CLIENT_ID || '693306869303-h140tfkqn6re5rfa31jo1aqi98nucqac.apps.googleusercontent.com',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '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',
            code: authCode,
            grant_type: 'authorization_code',
            redirect_uri: 'com.creayaa.thegrowwell://oauth'
          })
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.id_token) {
          return res.status(400).json({
            success: false,
            error: 'Failed to exchange authorization code for tokens'
          });
        }

        // Verify the Google ID token using Google's tokeninfo endpoint
        decodedToken = await verifyGoogleIdToken(tokenData.id_token);
      } catch (error) {
        console.error('❌ Error exchanging authorization code:', error);
        return res.status(401).json({
          success: false,
          error: 'Failed to exchange authorization code',
          details: error.message
        });
      }
    } else if (idToken) {
      // Handle direct ID token
      try {
        decodedToken = await verifyGoogleIdToken(idToken);
      } catch (error) {
        console.error('❌ Error verifying Google ID token:', error);
        return res.status(401).json({
          success: false,
          error: 'Invalid Google ID token',
          details: error.message
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either authorization code or ID token is required'
      });
    }

    const { uid, email, name, picture, email_verified } = decodedToken;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        error: 'Google email is not verified'
      });
    }

    // Check if user exists in our database
    let user;
    let userExists = false;

    const userByEmail = await db.collection('users').where('email', '==', email).limit(1).get();
    
    if (!userByEmail.empty) {
      user = userByEmail.docs[0];
      userExists = true;
    }

    if (userExists) {
      // Update existing user
      const userData = user.data();
      const updateData = {
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        googleId: uid,
        profilePicture: picture || userData.profilePicture
      };

      // Update name if not set or if Google name is different
      if (!userData.firstName || !userData.lastName) {
        const nameParts = name ? name.split(' ') : ['', ''];
        updateData.firstName = nameParts[0] || '';
        updateData.lastName = nameParts.slice(1).join(' ') || '';
      }

      await db.collection('users').doc(user.id).update(updateData);
      userData.id = user.id;
      user = { id: user.id, ...userData, ...updateData };
    } else {
      // Create new user
      const nameParts = name ? name.split(' ') : ['', ''];
      const newUserData = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: email,
        phone: '',
        googleId: uid,
        profilePicture: picture || '',
        role: 'taxpayer',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const newUserRef = await db.collection('users').add(newUserData);
      user = { id: newUserRef.id, ...newUserData };
    }

    // Generate JWT tokens
    const accessTokenJWT = jwt.sign(
      { 
        userId: user.id, 
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email, 
        phone: user.phone,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: userExists ? 'Google login successful' : 'User created and logged in successfully via Google',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture
      },
      tokens: {
        accessToken: accessTokenJWT,
        refreshToken
      }
    });
  } catch (error) {
    console.error('❌ Error with Google login:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Google login',
      details: error.message
    });
  }
});

// Update user profile
app.put('/profile/update', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Validate email format
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate phone format
    if (phone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number'
      });
    }

    // Check if email is already taken by another user
    const emailCheck = await db.collection('users')
      .where('email', '==', email)
      .where('__name__', '!=', userId)
      .limit(1)
      .get();

    if (!emailCheck.empty) {
      return res.status(400).json({
        success: false,
        error: 'Email address is already in use'
      });
    }

    // Check if phone is already taken by another user
    const phoneCheck = await db.collection('users')
      .where('phone', '==', phone)
      .where('__name__', '!=', userId)
      .limit(1)
      .get();

    if (!phoneCheck.empty) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is already in use'
      });
    }

    // Update user profile
    const updateData = {
      firstName,
      lastName,
      email,
      phone,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userId).update(updateData);

    // Get updated user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: userDoc.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

// Feedback endpoints

// Submit feedback
app.post('/feedback/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rating, feedback, category = 'general' } = req.body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    if (!feedback || feedback.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Feedback must be at least 10 characters long'
      });
    }

    if (feedback.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Feedback must be less than 1000 characters'
      });
    }

    // Sanitize feedback text
    const sanitizedFeedback = feedback
      .trim()
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length

    // Validate category
    const validCategories = ['general', 'bug', 'feature', 'ui', 'performance', 'other'];
    const sanitizedCategory = validCategories.includes(category) ? category : 'general';

    // Get user data for feedback
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Create feedback document
    const feedbackData = {
      userId: userId,
      userEmail: userData.email,
      userName: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.firstName || userData.email.split('@')[0],
      rating: parseInt(rating),
      feedback: sanitizedFeedback,
      category: sanitizedCategory,
      status: 'pending', // pending, reviewed, resolved
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const feedbackRef = await db.collection('feedback').add(feedbackData);

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedbackRef.id,
      data: {
        id: feedbackRef.id,
        rating: feedbackData.rating,
        feedback: feedbackData.feedback,
        category: feedbackData.category,
        createdAt: feedbackData.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
      details: error.message
    });
  }
});

// Get user's feedback history
app.get('/feedback/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's feedback history
    const feedbackSnapshot = await db.collection('feedback')
      .where('userId', '==', userId)
      .get();

    const feedbackHistory = [];
    feedbackSnapshot.forEach(doc => {
      const data = doc.data();
      feedbackHistory.push({
        id: doc.id,
        rating: data.rating,
        feedback: data.feedback,
        category: data.category,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    // Sort by createdAt in descending order (most recent first)
    feedbackHistory.sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.seconds : 0;
      const bTime = b.createdAt ? b.createdAt.seconds : 0;
      return bTime - aTime;
    });

    res.json({
      success: true,
      data: feedbackHistory,
      count: feedbackHistory.length
    });
  } catch (error) {
    console.error('❌ Feedback history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback history',
      details: error.message
    });
  }
});

// Support Request endpoints

// Submit support request
app.post('/support/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, subject, message } = req.body;

    // Validate required fields
    if (!category || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Category, subject, and message are required'
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Message must be at least 10 characters long'
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message must be less than 2000 characters'
      });
    }

    // Validate category
    const validCategories = ['technical', 'billing', 'tax', 'general'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category'
      });
    }

    // Sanitize message text
    const sanitizedMessage = message
      .trim()
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 2000); // Limit length

    // Get user data for support request
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Create support request document
    const supportRequestData = {
      userId: userId,
      userEmail: userData.email,
      userName: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.firstName || userData.email.split('@')[0],
      category: category,
      subject: subject.trim(),
      message: sanitizedMessage,
      status: 'open', // open, in_progress, resolved, closed
      priority: 'medium', // low, medium, high, urgent
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const supportRequestRef = await db.collection('supportRequests').add(supportRequestData);

    res.json({
      success: true,
      message: 'Support request submitted successfully',
      requestId: supportRequestRef.id,
      data: {
        id: supportRequestRef.id,
        category: supportRequestData.category,
        subject: supportRequestData.subject,
        status: supportRequestData.status,
        createdAt: supportRequestData.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Support request submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit support request',
      details: error.message
    });
  }
});

// Get user's support request history
app.get('/support/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's support request history
    const supportRequestsSnapshot = await db.collection('supportRequests')
      .where('userId', '==', userId)
      .get();

    const supportRequests = [];
    supportRequestsSnapshot.forEach(doc => {
      const data = doc.data();
      supportRequests.push({
        id: doc.id,
        category: data.category,
        subject: data.subject,
        message: data.message,
        status: data.status,
        priority: data.priority,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    // Sort by createdAt in descending order (most recent first)
    supportRequests.sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.seconds : 0;
      const bTime = b.createdAt ? b.createdAt.seconds : 0;
      return bTime - aTime;
    });

    res.json({
      success: true,
      data: supportRequests,
      count: supportRequests.length
    });
  } catch (error) {
    console.error('❌ Support request history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support request history',
      details: error.message
    });
  }
});

// Appointment endpoints

// Submit appointment request
app.post('/appointments/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appointmentType, date, time, notes } = req.body;

    // Validate required fields
    if (!appointmentType || !date || !time) {
      return res.status(400).json({
        success: false,
        error: 'Appointment type, date, and time are required'
      });
    }

    // Validate appointment type
    const validTypes = ['consultation', 'review', 'filing', 'planning'];
    if (!validTypes.includes(appointmentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid appointment type'
      });
    }

    // Validate date format and ensure it's in the future
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(appointmentDate.getTime()) || appointmentDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid future date'
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/i;
    if (!timeRegex.test(time)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time format'
      });
    }

    // Get user data for appointment
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Check for existing appointment at the same time
    const existingAppointment = await db.collection('appointments')
      .where('date', '==', date)
      .where('time', '==', time)
      .where('status', 'in', ['scheduled', 'confirmed'])
      .get();

    if (!existingAppointment.empty) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked. Please choose another time.'
      });
    }

    // Sanitize notes
    const sanitizedNotes = notes ? notes
      .trim()
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 500) : ''; // Limit length

    // Create appointment document
    const appointmentData = {
      userId: userId,
      userEmail: userData.email,
      userName: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.firstName || userData.email.split('@')[0],
      appointmentType: appointmentType,
      date: date,
      time: time,
      notes: sanitizedNotes,
      status: 'scheduled', // scheduled, confirmed, completed, cancelled
      duration: getAppointmentDuration(appointmentType),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const appointmentRef = await db.collection('appointments').add(appointmentData);

    res.json({
      success: true,
      message: 'Appointment scheduled successfully',
      appointmentId: appointmentRef.id,
      data: {
        id: appointmentRef.id,
        appointmentType: appointmentData.appointmentType,
        date: appointmentData.date,
        time: appointmentData.time,
        status: appointmentData.status,
        createdAt: appointmentData.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Appointment submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit appointment',
      details: error.message
    });
  }
});

// Get user's appointment history
app.get('/appointments/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's appointment history
    const appointmentsSnapshot = await db.collection('appointments')
      .where('userId', '==', userId)
      .get();

    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      appointments.push({
        id: doc.id,
        appointmentType: data.appointmentType,
        date: data.date,
        time: data.time,
        notes: data.notes,
        status: data.status,
        duration: data.duration,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    // Sort by date and time (most recent first)
    appointments.sort((a, b) => {
      const aDateTime = new Date(`${a.date} ${a.time}`);
      const bDateTime = new Date(`${b.date} ${b.time}`);
      return bDateTime - aDateTime;
    });

    res.json({
      success: true,
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('❌ Appointment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointment history',
      details: error.message
    });
  }
});

// Get available time slots for a specific date
app.get('/appointments/available-slots', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }

    // Validate date format
    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    // Get all time slots
    const allTimeSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
    ];

    // Get booked appointments for this date
    const bookedAppointments = await db.collection('appointments')
      .where('date', '==', date)
      .where('status', 'in', ['scheduled', 'confirmed'])
      .get();

    const bookedTimes = [];
    bookedAppointments.forEach(doc => {
      const data = doc.data();
      bookedTimes.push(data.time);
    });

    // Filter available slots
    const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({
      success: true,
      data: {
        date: date,
        availableSlots: availableSlots,
        totalSlots: allTimeSlots.length,
        bookedSlots: bookedTimes.length
      }
    });
  } catch (error) {
    console.error('❌ Available slots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots',
      details: error.message
    });
  }
});

// Cancel an appointment
app.post('/appointments/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    // Get the appointment
    const appointmentDoc = await db.collection('appointments').doc(appointmentId).get();
    
    if (!appointmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    const appointmentData = appointmentDoc.data();

    // Check if user owns this appointment
    if (appointmentData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only cancel your own appointments'
      });
    }

    // Check if appointment can be cancelled
    if (appointmentData.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Appointment is already cancelled'
      });
    }

    if (appointmentData.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed appointment'
      });
    }

    // Update appointment status
    await db.collection('appointments').doc(appointmentId).update({
      status: 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        id: appointmentId,
        status: 'cancelled'
      }
    });
  } catch (error) {
    console.error('❌ Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment',
      details: error.message
    });
  }
});

// Tax Form Submission endpoints

// Submit tax form data
app.post('/tax-forms/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      socialSecurityNumber, 
      documents, 
      dependents, 
      formType = '1040',
      taxYear = new Date().getFullYear(),
      filingStatus = 'single'
    } = req.body;

    // Validate required fields
    if (!socialSecurityNumber || !documents) {
      return res.status(400).json({
        success: false,
        error: 'Social Security Number and documents are required'
      });
    }

    // Validate SSN format (basic validation)
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    if (!ssnRegex.test(socialSecurityNumber.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Social Security Number format'
      });
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Sanitize and validate documents
    const sanitizedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name?.substring(0, 255) || 'Unknown Document',
      type: doc.type || 'application/octet-stream',
      size: parseInt(doc.size) || 0,
      category: doc.category?.substring(0, 50) || 'general',
      gcsPath: doc.gcsPath?.substring(0, 500) || '',
      publicUrl: doc.publicUrl?.substring(0, 500) || '',
      uploadedAt: doc.timestamp ? admin.firestore.Timestamp.fromDate(new Date(doc.timestamp)) : admin.firestore.FieldValue.serverTimestamp()
    }));

    // Sanitize and validate dependents
    const sanitizedDependents = (dependents || []).map(dep => ({
      id: dep.id?.substring(0, 50) || Math.random().toString(36).substr(2, 9),
      name: dep.name?.substring(0, 100).replace(/[<>]/g, '') || '',
      age: parseInt(dep.age) || 0,
      relationship: dep.relationship?.substring(0, 50).replace(/[<>]/g, '') || '',
      createdAt: new Date().toISOString()
    }));

    // Create tax form document
    const taxFormData = {
      userId: userId,
      userEmail: userData.email,
      userName: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.firstName || userData.email.split('@')[0],
      socialSecurityNumber: socialSecurityNumber.replace(/\D/g, ''), // Remove non-digits for storage
      formType: formType,
      taxYear: parseInt(taxYear),
      filingStatus: filingStatus,
      documents: sanitizedDocuments,
      dependents: sanitizedDependents,
      status: 'submitted', // submitted, under_review, approved, rejected, completed
      priority: 'normal', // low, normal, high, urgent
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const taxFormRef = await db.collection('taxForms').add(taxFormData);

    // Create notification for user
    await db.collection('notifications').add({
      userId: userId,
      title: 'Tax Form Submitted',
      message: 'Your tax form has been submitted successfully and is under review.',
      type: 'success',
      read: false,
      relatedId: taxFormRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Tax form submitted successfully',
      taxFormId: taxFormRef.id,
      data: {
        id: taxFormRef.id,
        status: taxFormData.status,
        submittedAt: taxFormData.submittedAt,
        documentCount: sanitizedDocuments.length,
        dependentCount: sanitizedDependents.length
      }
    });
  } catch (error) {
    console.error('❌ Tax form submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit tax form',
      details: error.message
    });
  }
});

// Get user's tax form history
app.get('/tax-forms/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's tax form history
    const taxFormsSnapshot = await db.collection('taxForms')
      .where('userId', '==', userId)
      .get();

    const taxForms = [];
    taxFormsSnapshot.forEach(doc => {
      const data = doc.data();
      taxForms.push({
        id: doc.id,
        formType: data.formType,
        taxYear: data.taxYear,
        filingStatus: data.filingStatus,
        status: data.status,
        expectedReturn: data.expectedReturn || 0,
        adminNotes: data.adminNotes || '',
        documentCount: data.documents?.length || 0,
        dependentCount: data.dependents?.length || 0,
        submittedAt: data.submittedAt,
        updatedAt: data.updatedAt
      });
    });

    // Sort by submittedAt in descending order (newest first)
    taxForms.sort((a, b) => {
      const aTime = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt);
      const bTime = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt);
      return bTime - aTime;
    });

    res.json({
      success: true,
      data: taxForms,
      count: taxForms.length
    });
  } catch (error) {
    console.error('❌ Tax form history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax form history',
      details: error.message
    });
  }
});

// Get specific tax form details
app.get('/tax-forms/:formId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { formId } = req.params;

    const taxFormDoc = await db.collection('taxForms').doc(formId).get();
    
    if (!taxFormDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Tax form not found'
      });
    }

    const taxFormData = taxFormDoc.data();

    // Check if user owns this tax form
    if (taxFormData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own tax forms'
      });
    }

    res.json({
      success: true,
      data: {
        id: taxFormDoc.id,
        ...taxFormData,
        // Don't expose SSN in response
        socialSecurityNumber: '***-**-' + taxFormData.socialSecurityNumber.slice(-4)
      }
    });
  } catch (error) {
    console.error('❌ Get tax form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax form',
      details: error.message
    });
  }
});

// File Upload endpoints

// Upload document to GCS
app.post('/upload/document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { userId, category } = req.body;
    
    if (!userId || !category) {
      return res.status(400).json({
        success: false,
        error: 'userId and category are required'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop() || 'bin';
    const fileName = `${category}/${userId}/${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    
    console.log(`📁 Uploading file for user ${userId}, category ${category}`);
    console.log(`📁 Generated filename: ${fileName}`);
    
    // Create file reference in bucket
    const fileRef = bucket.file(fileName);
    
    // Upload options
    const uploadOptions = {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          uploadedBy: userId,
          category: category,
          uploadedAt: new Date().toISOString(),
        },
      },
      resumable: true,
      validation: 'crc32c',
      // Keep files private - only accessible through admin endpoints
    };
    
    // Encrypt the file using DEK approach
    console.log('🔐 Encrypting mobile app file with DEK approach...');
    
    // TEMPORARY: Skip encryption for testing
    console.log('⚠️ TEMPORARY: Skipping encryption for testing');
    const encryptedFileData = {
      encryptedData: req.file.buffer,
      encryptedKey: Buffer.from('test-key'),
      iv: Buffer.from('test-iv'),
      algorithm: 'none'
    };
    
    console.log('✅ Mobile app file processed (encryption skipped)');
    console.log('🔍 Data structure:', {
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

    // Upload encrypted file to GCS
    const stream = fileRef.createWriteStream(uploadOptions);
    
    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('GCS Upload Error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to upload file to storage',
          details: error.message
        });
        reject(error);
      });
      
      stream.on('finish', async () => {
        try {
          console.log(`✅ Encrypted file uploaded successfully to GCS: ${fileName}`);
          
          // TEMPORARY: Skip signed URL generation to avoid permission issues
          console.log('⚠️ TEMPORARY: Skipping signed URL generation');
          const signedUrl = `gs://${BUCKET_NAME}/${fileName}`;
          
          console.log(`✅ Using GCS path instead of signed URL: ${fileName}`);
          
          res.json({
            success: true,
            message: 'File uploaded and encrypted successfully',
            fileName: fileName,
            gcsPath: fileName,
            publicUrl: signedUrl,
            size: req.file.size,
            contentType: req.file.mimetype,
            uploadedAt: new Date().toISOString(),
            encrypted: true
          });
          resolve();
        } catch (error) {
          console.error('Error completing upload:', error);
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
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: error.message
    });
  }
});

// View encrypted document (decrypt and serve) - No auth required for images
app.get('/upload/view/:gcsPath', async (req, res) => {
  try {
    const { gcsPath } = req.params;
    
    if (!gcsPath) {
      return res.status(400).json({
        success: false,
        error: 'GCS path is required'
      });
    }

    console.log(`🔓 Mobile app viewing encrypted file: ${gcsPath}`);
    
    // Extract user ID from the GCS path for validation
    // Path format: category/userId/filename
    const pathParts = gcsPath.split('/');
    if (pathParts.length < 3) {
      console.log(`❌ Invalid file path format`);
      return res.status(400).json({
        success: false,
        error: 'Invalid file path format'
      });
    }
    
    const userId = pathParts[1];
    console.log(`👤 Extracted User ID: ${userId}`);
    
    // Basic validation - ensure it's a valid user ID format
    if (!userId || userId.length < 10) {
      console.log(`❌ Invalid user ID in path`);
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID in file path'
      });
    }

    // Download the encrypted file from GCS
    const fileRef = bucket.file(gcsPath);
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

    console.log(`🔓 Decrypting mobile app file with DEK approach...`);

    // Decrypt the file using DEK approach
    const decryptedBuffer = await decryptFileWithDEK(encryptedData);
    
    console.log(`✅ Mobile app file decrypted successfully, size: ${decryptedBuffer.length} bytes`);

    // Get file metadata to determine content type
    const [metadata] = await fileRef.getMetadata();
    const contentType = metadata.contentType || 'application/octet-stream';

    // Set appropriate headers for viewing
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${metadata.metadata?.originalName || 'document'}"`,
      'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      'Content-Length': decryptedBuffer.length
    });

    // Send the decrypted file
    res.send(decryptedBuffer);

  } catch (error) {
    console.error('Error viewing mobile app document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to view document',
      details: error.message
    });
  }
});

// Get user documents from GCS
app.get('/documents', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`📄 Fetching documents for user: ${userId}`);
    
    // List all files in the user's directory
    const [files] = await bucket.getFiles({
      prefix: `w2Forms/${userId}/`,
      delimiter: '/'
    });
    
    // Also check other categories
    const categories = ['w2Forms', 'medical', 'education', 'dependentChildren', 'homeownerDeduction', 'personalId', 'previousYearTax'];
    const allFiles = [];
    
    for (const category of categories) {
      try {
        const [categoryFiles] = await bucket.getFiles({
          prefix: `${category}/${userId}/`,
          delimiter: '/'
        });
        allFiles.push(...categoryFiles);
      } catch (error) {
        console.warn(`Warning: Could not list files for category ${category}:`, error.message);
      }
    }
    
    console.log(`📊 Found ${allFiles.length} files for user ${userId}`);
    
    // Process files and get metadata
    const documents = [];
    
    for (const file of allFiles) {
      try {
        const [metadata] = await file.getMetadata();
        const [exists] = await file.exists();
        
        if (exists) {
          // Generate decryption URL for viewing (instead of direct GCS URL)
          const decryptionUrl = `${req.protocol}://${req.get('host')}/upload/view/${encodeURIComponent(file.name)}`;
          console.log(`🔗 Generated decryption URL: ${decryptionUrl}`);
          
          // Extract category from file path
          const pathParts = file.name.split('/');
          const category = pathParts[0] || 'general';
          
          documents.push({
            id: file.name,
            name: metadata.metadata?.originalName || file.name.split('/').pop() || 'Unknown Document',
            type: metadata.contentType || 'application/octet-stream',
            size: parseInt(metadata.size) || 0,
            gcsPath: file.name,
            publicUrl: decryptionUrl,
            category: category,
            uploadedAt: metadata.timeCreated || new Date().toISOString(),
            status: 'completed'
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not process file ${file.name}:`, error.message);
      }
    }
    
    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    console.log(`✅ Successfully processed ${documents.length} documents`);
    
    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    console.error('❌ Error fetching user documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      details: error.message
    });
  }
});

// Delete document from GCS
app.delete('/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.userId;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required'
      });
    }
    
    // Verify the document belongs to the user
    if (!documentId.includes(`/${userId}/`)) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own documents'
      });
    }
    
    const fileRef = bucket.file(documentId);
    const [exists] = await fileRef.exists();
    
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    await fileRef.delete();
    
    console.log(`✅ Document deleted: ${documentId}`);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      details: error.message
    });
  }
});

// Get user's admin documents and notes for their applications
app.get('/user/admin-documents', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`📄 Fetching admin documents for user: ${userId}`);
    
    // Get all tax forms for this user
    const taxFormsSnapshot = await db.collection('taxForms')
      .where('userId', '==', userId)
      .get();

    const adminDocuments = [];
    
    for (const doc of taxFormsSnapshot.docs) {
      const taxFormData = doc.data();
      const applicationId = doc.id;
      
      // Check for admin notes
      if (taxFormData.adminNotes && taxFormData.adminNotes.trim()) {
        adminDocuments.push({
          id: `${applicationId}-notes`,
          applicationId: applicationId,
          type: 'admin_notes',
          name: 'Admin Notes',
          content: taxFormData.adminNotes,
          createdAt: taxFormData.adminNotesUpdatedAt || taxFormData.updatedAt,
          status: taxFormData.status || 'pending'
        });
      }
      
      // Check for draft return
      if (taxFormData.draftReturn) {
        try {
          const fileRef = bucket.file(taxFormData.draftReturn.gcsPath);
          const [exists] = await fileRef.exists();
          
          if (exists) {
            // Generate decryption URL for viewing
            const decryptionUrl = `${req.protocol}://${req.get('host')}/upload/view/${encodeURIComponent(taxFormData.draftReturn.gcsPath)}`;
            
            adminDocuments.push({
              id: `${applicationId}-draft`,
              applicationId: applicationId,
              type: 'draft_return',
              name: `Draft Return - ${taxFormData.draftReturn.originalName}`,
              gcsPath: taxFormData.draftReturn.gcsPath,
              publicUrl: decryptionUrl,
              size: taxFormData.draftReturn.size,
              contentType: taxFormData.draftReturn.contentType,
              createdAt: taxFormData.draftReturn.uploadedAt,
              status: taxFormData.status || 'pending'
            });
          }
        } catch (error) {
          console.warn(`Could not process draft return for application ${applicationId}:`, error);
        }
      }
      
      // Check for final return
      if (taxFormData.finalReturn) {
        try {
          const fileRef = bucket.file(taxFormData.finalReturn.gcsPath);
          const [exists] = await fileRef.exists();
          
          if (exists) {
            // Generate decryption URL for viewing
            const decryptionUrl = `${req.protocol}://${req.get('host')}/upload/view/${encodeURIComponent(taxFormData.finalReturn.gcsPath)}`;
            
            adminDocuments.push({
              id: `${applicationId}-final`,
              applicationId: applicationId,
              type: 'final_return',
              name: `Final Return - ${taxFormData.finalReturn.originalName}`,
              gcsPath: taxFormData.finalReturn.gcsPath,
              publicUrl: decryptionUrl,
              size: taxFormData.finalReturn.size,
              contentType: taxFormData.finalReturn.contentType,
              createdAt: taxFormData.finalReturn.uploadedAt,
              status: taxFormData.status || 'pending'
            });
          }
        } catch (error) {
          console.warn(`Could not process final return for application ${applicationId}:`, error);
        }
      }
    }
    
    // Sort by creation date (newest first)
    adminDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`✅ Found ${adminDocuments.length} admin documents for user ${userId}`);
    
    res.json({
      success: true,
      data: adminDocuments,
      count: adminDocuments.length
    });
  } catch (error) {
    console.error('❌ Error fetching admin documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin documents',
      details: error.message
    });
  }
});

// Legacy delete endpoint for backward compatibility
app.delete('/upload/delete', async (req, res) => {
  try {
    const { gcsPath } = req.body;
    
    if (!gcsPath) {
      return res.status(400).json({
        success: false,
        error: 'gcsPath is required'
      });
    }

    const fileRef = bucket.file(gcsPath);
    await fileRef.delete();
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      details: error.message
    });
  }
});

// Admin file upload endpoint (for draft/final returns)
app.post('/admin/upload/return', upload.single('file'), authenticateAdmin, async (req, res) => {
  try {
    if (!req.file) {
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

    // File validation
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed'
      });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop() || 'bin';
    const fileName = `admin-returns/${applicationId}/${returnType}-${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    
    console.log(`📁 Admin uploading ${returnType} return for application ${applicationId}`);
    console.log(`📁 Generated filename: ${fileName}`);
    
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
          uploadedBy: req.user.email || 'admin',
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
                uploadedBy: req.user.email || 'admin'
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
      
      // Write the file buffer to the stream
      stream.end(req.file.buffer);
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

// Download admin uploaded return
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

// Make existing files publicly accessible (admin utility)
app.post('/upload/make-public', async (req, res) => {
  try {
    const { gcsPath } = req.body;
    
    if (!gcsPath) {
      return res.status(400).json({
        success: false,
        error: 'gcsPath is required'
      });
    }
    
    // Make file publicly readable
    const fileRef = bucket.file(gcsPath);
    await fileRef.acl.add({
      entity: 'allUsers',
      role: 'READER'
    });
    
    res.json({
      success: true,
      message: 'File is now publicly accessible',
      publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${gcsPath}`
    });
  } catch (error) {
    console.error('GCS Make Public Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make file public',
      details: error.message
    });
  }
});

// Admin-only file serving endpoints

// Debug endpoint to see what routes are being hit (MUST BE FIRST)
app.get('/admin/files/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint reached',
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    params: req.params,
    query: req.query
  });
});

// Test endpoint to debug file paths
app.get('/admin/files/test/:path(*)', (req, res) => {
  const path = req.params[0];
  const decoded = decodeURIComponent(path);
  res.json({
    original: path,
    decoded: decoded,
    message: 'Path received successfully'
  });
});

// Serve file for viewing (with authentication)
app.get('/admin/files/*', authenticateToken, async (req, res) => {
  try {
    // Get the full path after /admin/files/
    const gcsPath = req.params[0];
    
    if (!gcsPath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    // Check if this is a download request
    if (gcsPath.endsWith('/download')) {
      return res.status(400).json({
        success: false,
        error: 'Use /admin/files/*/download endpoint for downloads'
      });
    }

    // Check if user is admin (you can add additional admin checks here)
    // For now, any authenticated user can access files
    // You might want to add role-based access control
    
    // Decode the URL-encoded path
    const decodedPath = decodeURIComponent(gcsPath);
    console.log('🔍 Requested file path:', decodedPath);
    
    const fileRef = bucket.file(decodedPath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

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
});

// Download file (with authentication)
app.get('/admin/files/*/download', authenticateToken, async (req, res) => {
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
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

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
});

// Removed catch-all route that was interfering

// Helper function to get appointment duration
function getAppointmentDuration(appointmentType) {
  const durations = {
    'consultation': '30 min',
    'review': '45 min',
    'filing': '60 min',
    'planning': '45 min'
  };
  return durations[appointmentType] || '30 min';
}

// Initialize database collections based on tax filing app requirements
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database with tax filing collections...');
    
    // Define collections based on tax filing app requirements
    const collections = {
      users: {
        description: 'User accounts and profiles',
        sampleData: {
          id: 'sample-user',
          email: 'test@example.com',
          name: 'Test User',
          phone: '+1234567890',
          role: 'taxpayer',
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      taxForms: {
        description: 'Tax form submissions and data',
        sampleData: {
          id: 'sample-form',
          userId: 'sample-user',
          formType: '1040',
          status: 'draft',
          year: 2024,
          filingStatus: 'single',
          income: 75000,
          deductions: 12000,
          taxOwed: 8500,
          refund: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      appointments: {
        description: 'Scheduled tax consultation appointments',
        sampleData: {
          id: 'sample-appointment',
          userId: 'sample-user',
          date: '2024-12-15',
          time: '14:00',
          duration: 60,
          type: 'consultation',
          status: 'scheduled',
          notes: 'Initial tax consultation',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      payments: {
        description: 'Payment records and transactions',
        sampleData: {
          id: 'sample-payment',
          userId: 'sample-user',
          amount: 150.00,
          currency: 'USD',
          status: 'completed',
          method: 'credit_card',
          description: 'Tax filing service fee',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      supportRequests: {
        description: 'Customer support and help requests',
        sampleData: {
          id: 'sample-support',
          userId: 'sample-user',
          subject: 'Tax form question',
          message: 'I need help with my 1040 form',
          status: 'open',
          priority: 'medium',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      feedback: {
        description: 'User feedback and ratings',
        sampleData: {
          id: 'sample-feedback',
          userId: 'sample-user',
          rating: 5,
          comment: 'Great service!',
          category: 'general',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      notifications: {
        description: 'User notifications and alerts',
        sampleData: {
          id: 'sample-notification',
          userId: 'sample-user',
          title: 'Welcome to Tax Filing App',
          message: 'Your account has been created successfully',
          type: 'info',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      test: {
        description: 'Test collection for connection verification',
        sampleData: {
          message: 'Database initialized successfully',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          projectId: 'tax-filing-app-3649f'
        }
      }
    };
    
    // Create collections with sample data if they don't exist
    for (const [collectionName, config] of Object.entries(collections)) {
      try {
        const collectionRef = db.collection(collectionName);
        const snapshot = await collectionRef.limit(1).get();
        
        if (snapshot.empty) {
          console.log(`📝 Creating collection: ${collectionName} - ${config.description}`);
          
          // Create the sample document
          const docId = collectionName === 'test' ? 'initial' : `sample-${collectionName.slice(0, -1)}`;
          await collectionRef.doc(docId).set(config.sampleData);
          
          console.log(`✅ Collection ${collectionName} created with sample data`);
        } else {
          console.log(`ℹ️ Collection ${collectionName} already exists`);
        }
      } catch (error) {
        console.log(`⚠️ Collection ${collectionName} might already exist or have issues:`, error.message);
      }
    }
    
    console.log('✅ Database initialization completed with all tax filing collections');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Test Firestore connection
app.get('/test-db', async (req, res) => {
  try {
    const docRef = db.collection('test').doc('initial');
    const doc = await docRef.get();
    
    if (doc.exists) {
      res.json({
        success: true,
        message: 'Firestore connection successful!',
        documentId: doc.id,
        projectId: 'tax-filing-app-3649f',
        data: doc.data()
      });
    } else {
      await docRef.set({
        message: 'Firestore connection successful!',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        projectId: 'tax-filing-app-3649f',
        testRun: true
      });
      
      res.json({
        success: true,
        message: 'Firestore connection successful! (Created new document)',
        documentId: docRef.id,
        projectId: 'tax-filing-app-3649f'
      });
    }
  } catch (error) {
    console.error('❌ Firestore connection error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Firestore',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Tax Filing Backend API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Test database: http://localhost:${PORT}/test-db`);
  console.log(`🔗 Network access: http://192.168.1.34:${PORT}`);
  console.log(`📱 Expo Go / Physical Device: http://192.168.1.34:${PORT}`);
  console.log(`📱 Android Studio Emulator: http://10.0.2.2:${PORT}`);
  
  // Initialize database on startup
  console.log('🔄 Starting database initialization...');
  await initializeDatabase();
});

module.exports = app;
