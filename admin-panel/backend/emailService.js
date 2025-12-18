const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

/**
 * Email Notification Service
 * Handles sending email notifications to admins for various events
 */

let emailConfigCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get email configuration from Firebase
 * Uses caching to reduce database reads
 */
async function getEmailConfiguration(db) {
  const now = Date.now();
  
  // Return cached config if still valid
  if (emailConfigCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return emailConfigCache;
  }
  
  try {
    const emailConfigRef = db.collection('emailConfiguration').doc('settings');
    const emailConfigDoc = await emailConfigRef.get();
    
    if (!emailConfigDoc.exists) {
      return null;
    }
    
    const config = emailConfigDoc.data();
    
    // Check if email notifications are enabled
    if (!config.enabled) {
      return null;
    }
    
    // Validate required fields
    if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
      console.warn('Email configuration incomplete');
      return null;
    }
    
    // Cache the configuration
    emailConfigCache = config;
    cacheTimestamp = now;
    
    return config;
  } catch (error) {
    console.error('Error fetching email configuration:', error);
    return null;
  }
}

/**
 * Create nodemailer transporter from configuration
 */
function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.smtpHost.trim(),
    port: parseInt(config.smtpPort),
    secure: config.smtpSecure !== undefined ? config.smtpSecure : (parseInt(config.smtpPort) === 465),
    auth: {
      user: config.smtpUser.trim(),
      pass: config.smtpPassword
    }
  });
}

/**
 * Send email notification to admins
 * @param {Object} db - Firestore database instance
 * @param {Object} options - Email options
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 * @param {Object} options.data - Additional data for email template
 */
async function sendAdminNotification(db, options) {
  try {
    const config = await getEmailConfiguration(db);
    
    if (!config) {
      console.log('Email notifications disabled or configuration not found');
      return { success: false, reason: 'not_configured' };
    }
    
    // Parse admin emails
    const adminEmails = config.adminEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email);
    
    if (adminEmails.length === 0) {
      console.warn('No admin emails configured');
      return { success: false, reason: 'no_recipients' };
    }
    
    // Create transporter
    const transporter = createTransporter(config);
    
    // Verify connection
    try {
      await transporter.verify();
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return { success: false, reason: 'connection_failed', error: error.message };
    }
    
    // Prepare email
    const mailOptions = {
      from: `"${config.fromName.trim()}" <${config.fromEmail.trim()}>`,
      to: adminEmails.join(', '),
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML if no text provided
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email notification sent: ${options.subject}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, reason: 'send_failed', error: error.message };
  }
}

/**
 * Send notification for new user registration
 */
async function notifyNewUser(db, userData) {
  const userName = userData.firstName && userData.lastName
    ? `${userData.firstName} ${userData.lastName}`
    : userData.firstName || userData.email?.split('@')[0] || 'Unknown User';
  
  const subject = `New User Registration: ${userName}`;
  const html = `
    <h2>New User Registration</h2>
    <p>A new user has registered in the system.</p>
    <hr>
    <p><strong>User Details:</strong></p>
    <ul>
      <li><strong>Name:</strong> ${userName}</li>
      <li><strong>Email:</strong> ${userData.email || 'N/A'}</li>
      <li><strong>Phone:</strong> ${userData.phone || 'N/A'}</li>
      <li><strong>User ID:</strong> ${userData.id || userData.userId || 'N/A'}</li>
      <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    <hr>
    <p><small>This is an automated notification from the Tax Filing System.</small></p>
  `;
  
  return await sendAdminNotification(db, { subject, html });
}

/**
 * Send notification for new application creation
 */
async function notifyNewApplication(db, applicationData, userData) {
  const userName = userData.firstName && userData.lastName
    ? `${userData.firstName} ${userData.lastName}`
    : userData.firstName || userData.email?.split('@')[0] || 'Unknown User';
  
  const subject = `New Tax Application Submitted: ${userName}`;
  const html = `
    <h2>New Tax Application Submitted</h2>
    <p>A new tax application has been submitted.</p>
    <hr>
    <p><strong>Application Details:</strong></p>
    <ul>
      <li><strong>Application ID:</strong> ${applicationData.id || 'N/A'}</li>
      <li><strong>User:</strong> ${userName} (${userData.email || 'N/A'})</li>
      <li><strong>Form Type:</strong> ${applicationData.formType || '1040'}</li>
      <li><strong>Tax Year:</strong> ${applicationData.taxYear || new Date().getFullYear()}</li>
      <li><strong>Filing Status:</strong> ${applicationData.filingStatus || 'N/A'}</li>
      <li><strong>Documents:</strong> ${applicationData.documents?.length || 0} document(s)</li>
      <li><strong>Dependents:</strong> ${applicationData.dependents?.length || 0}</li>
      <li><strong>Status:</strong> ${applicationData.status || 'submitted'}</li>
      <li><strong>Submitted At:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    <hr>
    <p><small>This is an automated notification from the Tax Filing System.</small></p>
  `;
  
  return await sendAdminNotification(db, { subject, html });
}

/**
 * Send notification for additional document submission
 */
async function notifyAdditionalDocument(db, documentData, userData, applicationId) {
  const userName = userData.firstName && userData.lastName
    ? `${userData.firstName} ${userData.lastName}`
    : userData.firstName || userData.email?.split('@')[0] || 'Unknown User';
  
  const subject = `Additional Document Submitted: ${userName}`;
  const html = `
    <h2>Additional Document Submitted</h2>
    <p>A user has submitted an additional document for review.</p>
    <hr>
    <p><strong>Document Details:</strong></p>
    <ul>
      <li><strong>Document Name:</strong> ${documentData.name || 'Unknown'}</li>
      <li><strong>Category:</strong> ${documentData.category || 'general'}</li>
      <li><strong>Size:</strong> ${documentData.size ? (documentData.size / 1024).toFixed(2) + ' KB' : 'N/A'}</li>
      <li><strong>Application ID:</strong> ${applicationId || 'N/A'}</li>
      <li><strong>User:</strong> ${userName} (${userData.email || 'N/A'})</li>
      <li><strong>Submitted At:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    <hr>
    <p><small>This is an automated notification from the Tax Filing System.</small></p>
  `;
  
  return await sendAdminNotification(db, { subject, html });
}

/**
 * Send notification for draft document approval
 */
async function notifyDraftApproval(db, applicationData, userData) {
  const userName = userData.firstName && userData.lastName
    ? `${userData.firstName} ${userData.lastName}`
    : userData.firstName || userData.email?.split('@')[0] || 'Unknown User';
  
  const subject = `Draft Document Approved: ${userName}`;
  const html = `
    <h2>Draft Document Approved</h2>
    <p>A user has approved their draft tax return document.</p>
    <hr>
    <p><strong>Application Details:</strong></p>
    <ul>
      <li><strong>Application ID:</strong> ${applicationData.id || 'N/A'}</li>
      <li><strong>User:</strong> ${userName} (${userData.email || 'N/A'})</li>
      <li><strong>Tax Year:</strong> ${applicationData.taxYear || new Date().getFullYear()}</li>
      <li><strong>Status:</strong> ${applicationData.status || 'approved'}</li>
      <li><strong>Approved At:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    <hr>
    <p><small>This is an automated notification from the Tax Filing System.</small></p>
  `;
  
  return await sendAdminNotification(db, { subject, html });
}

/**
 * Send notification for payment
 */
async function notifyPayment(db, paymentData, userData) {
  const userName = userData.firstName && userData.lastName
    ? `${userData.firstName} ${userData.lastName}`
    : userData.firstName || userData.email?.split('@')[0] || 'Unknown User';
  
  const subject = `Payment Received: ${userName}`;
  const html = `
    <h2>Payment Received</h2>
    <p>A payment has been successfully processed.</p>
    <hr>
    <p><strong>Payment Details:</strong></p>
    <ul>
      <li><strong>Payment ID:</strong> ${paymentData.id || paymentData.paymentId || 'N/A'}</li>
      <li><strong>User:</strong> ${userName} (${userData.email || 'N/A'})</li>
      <li><strong>Amount:</strong> $${parseFloat(paymentData.amount || 0).toFixed(2)}</li>
      <li><strong>Status:</strong> ${paymentData.status || 'completed'}</li>
      <li><strong>Payment Method:</strong> ${paymentData.paymentMethod || 'N/A'}</li>
      <li><strong>Transaction ID:</strong> ${paymentData.transactionId || paymentData.id || 'N/A'}</li>
      <li><strong>Paid At:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    <hr>
    <p><small>This is an automated notification from the Tax Filing System.</small></p>
  `;
  
  return await sendAdminNotification(db, { subject, html });
}

module.exports = {
  sendAdminNotification,
  notifyNewUser,
  notifyNewApplication,
  notifyAdditionalDocument,
  notifyDraftApproval,
  notifyPayment
};

