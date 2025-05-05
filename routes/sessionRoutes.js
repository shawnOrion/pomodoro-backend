// sessionRoutes.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// These will be injected from index.js
let sessions = [];
let showDebugLogs = false;

const setSessionContext = (context) => {
  sessions = context.sessions;
  showDebugLogs = context.showDebugLogs;
};

// 🔔 Create a new session
router.post('/session', (req, res) => {
  const { message, delayInSeconds } = req.body;

  if (!message || !delayInSeconds) {
    return res.status(400).json({ error: 'Message and delayInSeconds are required' });
  }

  const id = uuidv4();
  const remindAt = new Date(Date.now() + delayInSeconds * 1000);

  const session = {
    id,
    message,
    remindAt,
    remaining: null,
    status: 'active',
  };

  sessions.push(session);

  if (showDebugLogs) {
    console.log(`📌 [CREATE] Session ${id} created: "${message}" | fires at ${remindAt.toLocaleTimeString()}`);
  }

  return res.json({ id, message, remindAt, status: session.status });
});

// 🟡 Pause a session
router.post('/session/:id/pause', (req, res) => {
  const session = sessions.find(s => s.id === req.params.id);
  if (!session || session.status !== 'active') {
    return res.status(404).json({ error: 'Active session not found' });
  }

  const now = new Date();
  session.remaining = Math.max(0, session.remindAt - now);
  session.status = 'paused';

  if (showDebugLogs) {
    console.log(`⏸️ [PAUSE] Session ${session.id} paused with ${Math.round(session.remaining / 1000)}s left.`);
  }

  return res.json({ id: session.id, status: session.status, remaining: session.remaining / 1000 });
});

// 🟢 Resume a session
router.post('/session/:id/resume', (req, res) => {
  const session = sessions.find(s => s.id === req.params.id);
  if (!session || session.status !== 'paused') {
    return res.status(404).json({ error: 'Paused session not found' });
  }

  session.remindAt = new Date(Date.now() + session.remaining);
  session.remaining = null;
  session.status = 'active';

  if (showDebugLogs) {
    console.log(`▶️ [RESUME] Session ${session.id} resumed, new fire time: ${session.remindAt.toLocaleTimeString()}`);
  }

  return res.json({ id: session.id, status: session.status, remindAt: session.remindAt });
});

// ❌ Cancel a session
router.post('/session/:id/cancel', (req, res) => {
  const session = sessions.find(s => s.id === req.params.id);
  if (!session || session.status === 'completed' || session.status === 'cancelled') {
    return res.status(404).json({ error: 'Session not found or already completed/cancelled' });
  }

  session.status = 'cancelled';

  if (showDebugLogs) {
    console.log(`🛑 [CANCEL] Session ${session.id} cancelled.`);
  }

  return res.json({ id: session.id, status: session.status });
});

// 🔍 Get session info
router.get('/session/:id', (req, res) => {
  const session = sessions.find(s => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (showDebugLogs) {
    console.log(`📥 [FETCH] Session ${session.id} fetched. Status: ${session.status}`);
  }

  return res.json(session);
});

module.exports = {
  router,
  setSessionContext,
};
