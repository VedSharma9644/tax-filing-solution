import React, { useState, useEffect } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import AdminApiService from '../services/api';
import './EmailConfiguration.css';

const EmailConfiguration = () => {
  const { hasPageAccess } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: '',
    smtpSecure: true,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    adminEmails: '',
    enabled: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchEmailConfiguration();
  }, []);

  const fetchEmailConfiguration = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await AdminApiService.getEmailConfiguration();
      
      if (response.success && response.data) {
        // Note: Password won't be returned from backend for security
        // User will need to re-enter it if they want to change it
        setFormData({
          smtpHost: response.data.smtpHost || '',
          smtpPort: response.data.smtpPort || '',
          smtpSecure: response.data.smtpSecure !== undefined ? response.data.smtpSecure : true,
          smtpUser: response.data.smtpUser || '',
          smtpPassword: '', // Don't pre-fill password
          fromEmail: response.data.fromEmail || '',
          fromName: response.data.fromName || '',
          adminEmails: response.data.adminEmails || '',
          enabled: response.data.enabled !== undefined ? response.data.enabled : false
        });
      }
    } catch (err) {
      console.error('Error fetching email configuration:', err);
      setError('Failed to load email configuration: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.smtpHost) {
      errors.smtpHost = 'SMTP Host is required';
    }
    
    if (!formData.smtpPort) {
      errors.smtpPort = 'SMTP Port is required';
    } else if (!/^\d+$/.test(formData.smtpPort)) {
      errors.smtpPort = 'SMTP Port must be a number';
    }
    
    if (!formData.smtpUser) {
      errors.smtpUser = 'SMTP Username is required';
    }
    
    // Password is only required if this is the first time saving (no existing config)
    // We'll check this on the backend, but we can skip frontend validation
    // since backend will handle it appropriately
    
    if (!formData.fromEmail) {
      errors.fromEmail = 'From Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.fromEmail)) {
      errors.fromEmail = 'From Email is invalid';
    }
    
    if (!formData.fromName) {
      errors.fromName = 'From Name is required';
    }
    
    if (!formData.adminEmails) {
      errors.adminEmails = 'Admin Email(s) is required';
    } else {
      const emails = formData.adminEmails.split(',').map(email => email.trim());
      const invalidEmails = emails.filter(email => !/\S+@\S+\.\S+/.test(email));
      if (invalidEmails.length > 0) {
        errors.adminEmails = 'One or more admin emails are invalid';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      const response = await AdminApiService.saveEmailConfiguration(formData);
      
      if (response.success) {
        setSuccess('Email configuration saved successfully!');
        // Clear password field after successful save
        setFormData(prev => ({ ...prev, smtpPassword: '' }));
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.error || 'Failed to save email configuration');
      }
    } catch (err) {
      console.error('Error saving email configuration:', err);
      setError('Failed to save email configuration: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      const response = await AdminApiService.testEmailConfiguration(formData);
      
      if (response.success) {
        setSuccess(`Test email sent successfully to ${response.data?.recipient || 'admin email'}! Please check your inbox.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.error || 'Failed to send test email');
      }
    } catch (err) {
      console.error('Error sending test email:', err);
      setError('Failed to send test email: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (!hasPageAccess('email-configuration')) {
    return (
      <div className="email-config-access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="email-config-loading">
        <div className="loading-spinner"></div>
        <p>Loading email configuration...</p>
      </div>
    );
  }

  return (
    <div className="email-configuration">
      <div className="email-config-header">
        <h1>Email Configuration</h1>
        <p className="subtitle">Configure SMTP settings for sending notification emails to admins</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="email-config-content">
        <form onSubmit={handleSubmit} className="email-config-form">
          <div className="form-section">
            <h2>SMTP Server Settings</h2>
            
            <div className="form-group">
              <label htmlFor="smtpHost">
                SMTP Host <span className="required">*</span>
              </label>
              <input
                type="text"
                id="smtpHost"
                name="smtpHost"
                value={formData.smtpHost}
                onChange={handleInputChange}
                placeholder="e.g., smtp.gmail.com"
                className={formErrors.smtpHost ? 'error' : ''}
              />
              {formErrors.smtpHost && (
                <span className="field-error">{formErrors.smtpHost}</span>
              )}
              <small>Enter your SMTP server hostname</small>
            </div>

            <div className="form-group">
              <label htmlFor="smtpPort">
                SMTP Port <span className="required">*</span>
              </label>
              <input
                type="text"
                id="smtpPort"
                name="smtpPort"
                value={formData.smtpPort}
                onChange={handleInputChange}
                placeholder="e.g., 587 or 465"
                className={formErrors.smtpPort ? 'error' : ''}
              />
              {formErrors.smtpPort && (
                <span className="field-error">{formErrors.smtpPort}</span>
              )}
              <small>Common ports: 587 (TLS), 465 (SSL), 25 (unsecured)</small>
            </div>

            <div className="form-group">
              <label htmlFor="smtpSecure">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  name="smtpSecure"
                  checked={formData.smtpSecure}
                  onChange={handleInputChange}
                />
                Use Secure Connection (TLS/SSL)
              </label>
              <small>Enable this for encrypted connections (recommended)</small>
            </div>

            <div className="form-group">
              <label htmlFor="smtpUser">
                SMTP Username <span className="required">*</span>
              </label>
              <input
                type="text"
                id="smtpUser"
                name="smtpUser"
                value={formData.smtpUser}
                onChange={handleInputChange}
                placeholder="Your SMTP username or email"
                className={formErrors.smtpUser ? 'error' : ''}
              />
              {formErrors.smtpUser && (
                <span className="field-error">{formErrors.smtpUser}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="smtpPassword">
                SMTP Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="smtpPassword"
                name="smtpPassword"
                value={formData.smtpPassword}
                onChange={handleInputChange}
                placeholder="Enter password to update, leave blank to keep current"
                className={formErrors.smtpPassword ? 'error' : ''}
              />
              {formErrors.smtpPassword && (
                <span className="field-error">{formErrors.smtpPassword}</span>
              )}
              <small>Leave blank to keep current password. For Gmail, use an App Password instead of your regular password</small>
            </div>
          </div>

          <div className="form-section">
            <h2>Email Settings</h2>
            
            <div className="form-group">
              <label htmlFor="fromEmail">
                From Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="fromEmail"
                name="fromEmail"
                value={formData.fromEmail}
                onChange={handleInputChange}
                placeholder="noreply@yourdomain.com"
                className={formErrors.fromEmail ? 'error' : ''}
              />
              {formErrors.fromEmail && (
                <span className="field-error">{formErrors.fromEmail}</span>
              )}
              <small>This email will appear as the sender</small>
            </div>

            <div className="form-group">
              <label htmlFor="fromName">
                From Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="fromName"
                name="fromName"
                value={formData.fromName}
                onChange={handleInputChange}
                placeholder="GrowWell Tax Admin"
                className={formErrors.fromName ? 'error' : ''}
              />
              {formErrors.fromName && (
                <span className="field-error">{formErrors.fromName}</span>
              )}
              <small>Display name for the sender</small>
            </div>

            <div className="form-group">
              <label htmlFor="adminEmails">
                Admin Email Addresses <span className="required">*</span>
              </label>
              <textarea
                id="adminEmails"
                name="adminEmails"
                value={formData.adminEmails}
                onChange={handleInputChange}
                placeholder="admin1@example.com, admin2@example.com"
                rows="3"
                className={formErrors.adminEmails ? 'error' : ''}
              />
              {formErrors.adminEmails && (
                <span className="field-error">{formErrors.adminEmails}</span>
              )}
              <small>Comma-separated list of admin emails to receive notifications</small>
            </div>
          </div>

          <div className="form-section">
            <h2>General Settings</h2>
            
            <div className="form-group">
              <label htmlFor="enabled">
                <input
                  type="checkbox"
                  id="enabled"
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleInputChange}
                />
                Enable Email Notifications
              </label>
              <small>When enabled, admins will receive email notifications for user application changes</small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleTestEmail}
              className="test-button"
              disabled={saving || loading}
            >
              {saving ? 'Sending...' : 'Send Test Email'}
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailConfiguration;

