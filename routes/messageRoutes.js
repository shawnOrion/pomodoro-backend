// messageRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db/queries');

// POST /api/messages - create a new message
router.post('/messages', async (req, res) => {
  console.group('💬 [POST] New Message');
  const { id, userId, role, content } = req.body;

  if (!id || !userId || !role || !content) {
    console.warn('⚠️ Missing required fields');
    return res.status(400).json({ error: 'Missing required fields: id, userId, role, content' });
  }

  try {
    const message = await db.insertMessage({ id, userId, role, content });
    console.log('✅ Message inserted:', message);
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('❌ Error inserting message:', error.message);
    res.status(500).json({ error: 'Failed to insert message.' });
  } finally {
    console.groupEnd();
  }
});

// GET /api/messages/:userId - fetch messages for a user
router.get('/messages/:userId', async (req, res) => {
  console.group('📨 [GET] User Messages');
  const { userId } = req.params;

  try {
    const messages = await db.getMessagesByUserId(userId);
    console.log(`✅ Fetched ${messages.length} messages for user ${userId}`);
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('❌ Error fetching messages:', error.message);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  } finally {
    console.groupEnd();
  }
});

router.delete('/messages/:id', async (req, res) => {
    console.group('🗑️ [DELETE] Message');
    const { id } = req.params;
  
    if (!id) {
      console.warn('⚠️ Missing message ID in request.');
      return res.status(400).json({ error: 'Message ID is required.' });
    }
  
    try {
      const deletedMessage = await db.deleteMessageById(id);
  
      if (!deletedMessage) {
        console.warn(`⚠️ No message found to delete with ID: ${id}`);
        return res.status(404).json({ error: 'Message not found.' });
      }
  
      console.log(`✅ Deleted message:`, deletedMessage);
      res.status(200).json({ success: true, deleted: deletedMessage });
    } catch (error) {
      console.error('❌ Error deleting message:', error.message);
      res.status(500).json({ error: 'Failed to delete message.' });
    } finally {
      console.groupEnd();
    }
  });

module.exports = router;
