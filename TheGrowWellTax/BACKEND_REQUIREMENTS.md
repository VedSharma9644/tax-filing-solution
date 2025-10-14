# 🔐 **Backend Requirements for Persistent Authentication**

## **📋 Overview**
This document outlines the complete backend implementation required to support persistent authentication in the mobile application. The mobile app has been updated to handle token validation, refresh, and automatic re-authentication.

---

## **🚀 New API Endpoints Required**

### **1. Token Validation Endpoint**
**Purpose**: Validate if a stored access token is still valid

#### **Endpoint**: `POST /auth/validate-token`
#### **Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### **Request Body**: None (token is in Authorization header)

#### **Response**:
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "phone": "+1234567890",
    "name": "User Name",
    "profileComplete": true
  }
}
```

#### **Error Response** (401):
```json
{
  "success": false,
  "error": "Token expired or invalid",
  "code": "TOKEN_INVALID"
}
```

#### **Implementation Notes**:
- Verify JWT signature and expiration
- Check if token is blacklisted (if implementing token blacklisting)
- Return user data if token is valid
- Return 401 if token is invalid/expired

---

### **2. Token Refresh Endpoint**
**Purpose**: Generate new access token using refresh token

#### **Endpoint**: `POST /auth/refresh-token`
#### **Headers**:
```
Content-Type: application/json
```

#### **Request Body**:
```json
{
  "refreshToken": "refresh_token_string"
}
```

#### **Response**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "new_access_token_jwt",
  "refreshToken": "new_refresh_token_jwt",
  "expiresIn": 3600,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "phone": "+1234567890",
    "name": "User Name",
    "profileComplete": true
  }
}
```

#### **Error Response** (401):
```json
{
  "success": false,
  "error": "Refresh token expired or invalid",
  "code": "REFRESH_TOKEN_INVALID"
}
```

#### **Implementation Notes**:
- Validate refresh token signature and expiration
- Generate new access token and refresh token pair
- Optionally rotate refresh tokens for security
- Return updated user data
- Blacklist old refresh token (if implementing rotation)

---

## **🔧 Existing Endpoints Updates**

### **1. Google Login Endpoint** (Update Required)
**Current**: `POST /auth/google-login`

#### **Updated Response Format**:
```json
{
  "success": true,
  "message": "Google login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "profileComplete": true
  },
  "tokens": {
    "accessToken": "access_token_jwt",
    "refreshToken": "refresh_token_jwt",
    "expiresIn": 3600
  }
}
```

#### **Changes Required**:
- Return both `accessToken` and `refreshToken` in `tokens` object
- Ensure refresh token is included in response
- Maintain backward compatibility

---

### **2. Phone OTP Login Endpoint** (Update Required)
**Current**: `POST /auth/phone-login`

#### **Updated Response Format**:
```json
{
  "success": true,
  "message": "Phone login successful",
  "user": {
    "id": "user_id",
    "phone": "+1234567890",
    "name": "User Name",
    "profileComplete": true
  },
  "accessToken": "access_token_jwt",
  "refreshToken": "refresh_token_jwt",
  "expiresIn": 3600
}
```

#### **Changes Required**:
- Add `refreshToken` to response
- Ensure both tokens are returned
- Maintain existing response structure

---

## **🔐 JWT Token Configuration**

### **Access Token**:
- **Expiration**: 1 hour (3600 seconds)
- **Algorithm**: HS256 or RS256
- **Payload**:
  ```json
  {
    "sub": "user_id",
    "email": "user@example.com",
    "phone": "+1234567890",
    "iat": 1234567890,
    "exp": 1234571490,
    "type": "access"
  }
  ```

### **Refresh Token**:
- **Expiration**: 30 days (2592000 seconds)
- **Algorithm**: HS256 or RS256
- **Payload**:
  ```json
  {
    "sub": "user_id",
    "iat": 1234567890,
    "exp": 1237151490,
    "type": "refresh",
    "jti": "unique_token_id"
  }
  ```

---

## **🗄️ Database Schema Updates**

### **1. Users Table** (if not exists)
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  name VARCHAR(255),
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **2. Refresh Tokens Table** (New)
```sql
CREATE TABLE refresh_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### **3. Token Blacklist Table** (Optional - for security)
```sql
CREATE TABLE token_blacklist (
  id VARCHAR(255) PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at)
);
```

---

## **🔒 Security Implementation**

### **1. Token Generation**
```javascript
// Example JWT generation (Node.js with jsonwebtoken)
const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (user) => {
  const tokenId = require('crypto').randomUUID();
  return jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
      jti: tokenId
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};
```

### **2. Token Validation**
```javascript
const validateAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

const validateRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // Check if token exists in database and is not revoked
    const tokenRecord = await db.refreshTokens.findOne({
      where: { id: decoded.jti, is_revoked: false }
    });
    
    if (!tokenRecord) {
      return { valid: false, error: 'Token not found or revoked' };
    }
    
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};
```

### **3. Token Refresh Logic**
```javascript
const refreshToken = async (refreshToken) => {
  // Validate refresh token
  const validation = validateRefreshToken(refreshToken);
  if (!validation.valid) {
    throw new Error('Invalid refresh token');
  }
  
  // Get user data
  const user = await db.users.findById(validation.payload.sub);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  
  // Revoke old refresh token
  await db.refreshTokens.update(
    { is_revoked: true },
    { where: { id: validation.payload.jti } }
  );
  
  // Store new refresh token
  await db.refreshTokens.create({
    id: newRefreshToken.jti,
    user_id: user.id,
    token_hash: hashToken(newRefreshToken),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });
  
  return {
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 3600,
    user: user
  };
};
```

---

## **📱 Mobile App Integration**

### **1. Token Storage**
The mobile app will store tokens securely using:
- **Access Token**: Stored in secure storage
- **Refresh Token**: Stored in secure storage
- **User Data**: Stored in secure storage

### **2. Automatic Token Refresh**
The mobile app will:
- Automatically refresh tokens when they expire
- Retry failed requests with new tokens
- Handle refresh failures by redirecting to login

### **3. Error Handling**
The mobile app will handle:
- Invalid/expired tokens
- Network errors during refresh
- Refresh token expiration
- Server errors

---

## **🧪 Testing Requirements**

### **1. Unit Tests**
- Token generation and validation
- Refresh token logic
- Database operations
- Error handling

### **2. Integration Tests**
- Complete authentication flow
- Token refresh flow
- Error scenarios
- Database transactions

### **3. Security Tests**
- Token tampering attempts
- Expired token handling
- Refresh token rotation
- SQL injection prevention

---

## **📊 Monitoring & Logging**

### **1. Logging**
- Token generation events
- Token validation attempts
- Refresh token usage
- Authentication failures
- Security events

### **2. Metrics**
- Token refresh success rate
- Authentication failure rate
- Token expiration patterns
- User session duration

### **3. Alerts**
- High authentication failure rate
- Suspicious token usage
- Database connection issues
- Token generation errors

---

## **🚀 Deployment Checklist**

### **1. Environment Variables**
```bash
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=2592000
```

### **2. Database Migrations**
- Create users table (if not exists)
- Create refresh_tokens table
- Create token_blacklist table (optional)
- Add necessary indexes

### **3. API Documentation**
- Update API documentation
- Add new endpoints to OpenAPI/Swagger
- Document error codes and responses

### **4. Security Review**
- Review JWT implementation
- Test token security
- Validate refresh token rotation
- Check for security vulnerabilities

---

## **📞 Support & Maintenance**

### **1. Common Issues**
- Token expiration handling
- Refresh token rotation
- Database connection issues
- JWT secret management

### **2. Monitoring**
- Set up alerts for authentication failures
- Monitor token refresh success rates
- Track user session patterns
- Monitor database performance

### **3. Updates**
- Regular security updates
- JWT library updates
- Database optimization
- Performance monitoring

---

## **✅ Implementation Priority**

### **High Priority (Must Have)**
1. ✅ **Token Validation Endpoint** - `/auth/validate-token`
2. ✅ **Token Refresh Endpoint** - `/auth/refresh-token`
3. ✅ **Update Existing Login Endpoints** - Return refresh tokens
4. ✅ **Database Schema** - Add refresh tokens table

### **Medium Priority (Should Have)**
1. 🔄 **Token Blacklisting** - For security
2. 🔄 **Refresh Token Rotation** - Enhanced security
3. 🔄 **Monitoring & Logging** - Operational visibility

### **Low Priority (Nice to Have)**
1. 🔐 **Advanced Security** - Rate limiting, etc.
2. 🔐 **Session Management** - Multi-device support
3. 🔐 **Audit Logging** - Detailed security logs

---

**🎯 This implementation will enable persistent authentication in your mobile app, allowing users to stay logged in across app restarts and providing a seamless user experience!**
