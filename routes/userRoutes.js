// userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db/queries');
const bcrypt = require('bcrypt');

// 🔹 Get all users
router.get('/users', async (req, res) => {
  console.group('👥 [GET] All Users');
  try {
    const users = await db.getAllUsers();
    console.log('Fetched users:', users);
    res.status(200).json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    res.status(500).json({ error: 'Failed to fetch users.' });
  } finally {
    console.groupEnd();
  }
});

// 🔹 Get a specific user by ID
router.get('/users/:userId', async (req, res) => {
  console.group('👤 [GET] User by ID');
  const { userId } = req.params;
  try {
    const user = await db.getUserById(userId);
    if (!user) {
      console.warn('⚠️ User not found with ID:', userId);
      return res.status(404).json({ error: 'User not found.' });
    }
    console.log('Fetched user:', user);
    res.status(200).json(user);
  } catch (error) {
    console.error('❌ Error fetching user by ID:', error.message);
    res.status(500).json({ error: 'Failed to fetch user.' });
  } finally {
    console.groupEnd();
  }
});

// 🔹 Update a specific user by ID
router.put('/users/:userId', async (req, res) => {
  console.group('✏️ [PUT] Update User');
  const { userId } = req.params;
  const { username, phone, password } = req.body;
  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.updateUser(userId, username, phone, hashedPassword);
    if (!updatedUser) {
      console.warn('⚠️ No user found to update with ID:', userId);
      return res.status(404).json({ error: 'User not found.' });
    }

    console.log('Updated user:', updatedUser);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    res.status(500).json({ error: 'Failed to update user.' });
  } finally {
    console.groupEnd();
  }
});

// 🔹 Delete a specific user by ID
router.delete('/users/:userId', async (req, res) => {
  console.group('🗑️ [DELETE] User');
  const { userId } = req.params;
  try {
    const deletedUser = await db.deleteUser(userId);
    if (!deletedUser) {
      console.warn('⚠️ No user found to delete with ID:', userId);
      return res.status(404).json({ error: 'User not found.' });
    }

    console.log('Deleted user:', deletedUser);
    res.status(200).json({ message: 'User deleted successfully.', id: deletedUser.id });
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    res.status(500).json({ error: 'Failed to delete user.' });
  } finally {
    console.groupEnd();
  }
});

module.exports = router;
