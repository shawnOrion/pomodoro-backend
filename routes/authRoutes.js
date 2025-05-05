const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const db = require('../db/queries');

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  const { username, password, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.insertUser(username, phone, hashedPassword); 
    res.status(201).json({ message: 'User registered successfully.', user });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// Login route
router.post('/login', (req, res, next) => {
    console.group('🔐 Login Attempt');
    console.log('Request Body:', req.body);
  
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('❌ Passport authentication error:', err.message || err);
        console.groupEnd();
        return res.status(500).json({ error: 'Internal server error during authentication.' });
      }
  
      if (!user) {
        console.warn('⚠️ No user returned from authentication:', info.message || info);
        console.groupEnd();
        return res.status(401).json({ error: info.message || 'Authentication failed.' });
      }
  
      console.log('✅ User authenticated, proceeding to login:', { id: user.id, username: user.username });
  
      req.login(user, (err) => {
        if (err) {
          console.error('❌ Error during req.login (session creation):', err.message || err);
          console.groupEnd();
          return res.status(500).json({ error: 'Login failed during session creation.' });
        }
  
        console.log('🎉 Login and session creation successful for user:', { id: user.id, username: user.username });
        console.groupEnd();
        res.status(200).json({ message: 'Login successful.', user });
      });
    })(req, res, next);
  });
  
// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout.' });
    res.status(200).json({ message: 'Logout successful.' });
  });
});

// Check auth status
router.get('/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ isAuthenticated: true, user: req.user });
  } else {
    res.status(200).json({ isAuthenticated: false });
  }
});

module.exports = router;
