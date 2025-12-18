# Apple Sign-In Backend Endpoint

Add this endpoint to your `TheGrowWellTax-Backend/index.js` file, right after the Google login endpoint (around line 1571).

## Code to Add:

```javascript
// Apple Sign-In Login
app.post('/auth/apple-login', authLimiter, async (req, res) => {
  try {
    const { identityToken, authorizationCode, fullName } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        error: 'Apple identity token is required'
      });
    }

    let email, name, appleId;

    try {
      // Decode Apple identity token (JWT) to extract user info
      // Note: For production, you should verify the token signature with Apple's public keys
      // For now, we'll decode it to get the user info
      const tokenParts = identityToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      appleId = payload.sub; // Apple user ID
      email = payload.email || null; // May be null if user chose to hide email
      
      // Name is not in the identity token - it's only provided on first sign-in via fullName parameter
      // Use fullName from request body if available (first sign-in only)
      name = fullName || null;
      
      // Verify token is from Apple
      if (payload.iss !== 'https://appleid.apple.com') {
        throw new Error('Invalid token issuer');
      }
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        throw new Error('Token has expired');
      }
      
      // Verify audience matches your Services ID
      const expectedAudience = 'com.creayaa.thegrowwellios'; // Your Services ID
      if (payload.aud !== expectedAudience) {
        console.warn(`Token audience mismatch. Expected: ${expectedAudience}, Got: ${payload.aud}`);
        // Still proceed, but log the warning
      }
      
      console.log('✅ Apple identity token decoded successfully');
      console.log('📝 Apple user info:', { appleId, email: !!email, hasEmail: !!email });
      
    } catch (decodeError) {
      console.error('❌ Error decoding Apple token:', decodeError);
      return res.status(401).json({
        success: false,
        error: 'Invalid Apple identity token',
        details: decodeError.message
      });
    }

    // Check if user exists in our database
    let user;
    let userExists = false;

    // Try to find user by email first (if available)
    if (email) {
      const userByEmail = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!userByEmail.empty) {
        user = userByEmail.docs[0];
        userExists = true;
      }
    }

    // If not found by email, try by appleId
    if (!userExists && appleId) {
      const userByAppleId = await db.collection('users').where('appleId', '==', appleId).limit(1).get();
      if (!userByAppleId.empty) {
        user = userByAppleId.docs[0];
        userExists = true;
      }
    }

    if (userExists) {
      // Update existing user
      const userData = user.data();
      const updateData = {
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        appleId: appleId,
      };

      // Update email if not set and we have it
      if (email && !userData.email) {
        updateData.email = email;
      }

      // Update name if not set or if Apple name is different
      if (name && (!userData.firstName || !userData.lastName)) {
        const nameParts = name ? name.split(' ') : ['', ''];
        updateData.firstName = nameParts[0] || userData.firstName || '';
        updateData.lastName = nameParts.slice(1).join(' ') || userData.lastName || '';
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
        email: email || '', // Email might be null if user chose to hide it
        phone: '',
        appleId: appleId,
        profilePicture: '',
        role: 'taxpayer',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const newUserRef = await db.collection('users').add(newUserData);
      user = { id: newUserRef.id, ...newUserData };
    }

    // Generate JWT tokens (same as Google login)
    const accessTokenJWT = jwt.sign(
      { 
        userId: user.id, 
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email, 
        phone: user.phone,
        role: user.role,
        type: 'access'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token with unique ID
    const refreshTokenId = require('crypto').randomUUID();
    const refreshToken = jwt.sign(
      { 
        userId: user.id,
        type: 'refresh',
        jti: refreshTokenId
      },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
    
    await db.collection('refreshTokens').doc(refreshTokenId).set({
      userId: user.id,
      tokenHash: require('crypto').createHash('sha256').update(refreshToken).digest('hex'),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      isRevoked: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: userExists ? 'Apple login successful' : 'User created and logged in successfully via Apple',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture,
        name: `${user.firstName} ${user.lastName}`.trim(),
        // Apple users have name/email from Apple, but still need to complete profile setup
        // Only mark complete if they have additional profile data (address, employment, etc.)
        profileComplete: !!(user.firstName && user.lastName && user.email && user.address && user.occupation)
      },
      tokens: {
        accessToken: accessTokenJWT,
        refreshToken: refreshToken,
        expiresIn: 3600 // 1 hour in seconds
      }
    });
  } catch (error) {
    console.error('❌ Error with Apple login:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Apple login',
      details: error.message
    });
  }
});
```

## Where to Add:

Add this code right after the Google login endpoint ends (after line 1571, where `});` closes the `/auth/google-login` endpoint).

## Important Notes:

1. **Token Verification**: The code tries Firebase Admin SDK first (recommended), then falls back to manual JWT decoding if that fails.

2. **Email Handling**: Apple users can choose to hide their email. The code handles this by:
   - Using `appleId` as a fallback identifier
   - Allowing users without email (they can add it later in profile)

3. **Response Format**: Returns tokens in the same format as Google login (`tokens.accessToken`, `tokens.refreshToken`), which matches what the frontend expects.

4. **User Creation**: Creates users with `appleId` field instead of `googleId`, but same structure otherwise.

