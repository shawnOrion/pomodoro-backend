// goalRoutes.js
const express = require('express');
const db = require('../db/queries');
const router = express.Router();

// Create a new goal
router.post('/goal', async (req, res) => {
  console.group('📥 [POST] Create Goal');
  const { id, userId, text, time, phone, isRepeatEnabled = false, repeatDays = [] } = req.body;

  if (!id || !userId || !text || !time || !phone) {
    console.warn('⚠️ Missing required fields.');
    return res.status(400).json({ error: 'Missing required fields: id, userId, text, time, phone' });
  }

  try {
    const newGoal = await db.insertGoal({
      id,
      userId,
      text,
      time,
      phone,
      isRepeatEnabled,
      repeatDays,
      status: 'pending'
    });
    console.log('✅ Goal created:', newGoal);
    res.status(201).json({ success: true, goal: newGoal });
  } catch (error) {
    console.error('❌ Error creating goal:', error.message);
    res.status(500).json({ error: 'Failed to create goal.' });
  } finally {
    console.groupEnd();
  }
});

// Fetch all goals for a user
router.get('/goals/:userId', async (req, res) => {
  console.group('📚 [GET] Goals for User');
  const { userId } = req.params;

  if (!userId) {
    console.warn('⚠️ Missing userId.');
    return res.status(400).json({ error: 'Missing userId parameter.' });
  }

  try {
    const goals = await db.getGoalsByUserId(userId);
    console.log(`✅ Fetched ${goals.length} goals for user ${userId}.`);
    res.status(200).json(goals);
  } catch (error) {
    console.error('❌ Error fetching goals:', error.message);
    res.status(500).json({ error: 'Failed to fetch goals.' });
  } finally {
    console.groupEnd();
  }
});

// Update an existing goal
router.patch('/goal/:id', async (req, res) => {
  console.group('✏️ [PATCH] Update Goal');
  const { id } = req.params;
  const { userId, text, time, isRepeatEnabled, repeatDays } = req.body;

  try {
    const goalList = await db.getGoalsByUserId(userId);
    const goal = goalList.find(g => g.id === id);

    if (!goal) {
      console.warn('⚠️ Goal not found or does not belong to user:', id);
      return res.status(404).json({ error: `Goal with id "${id}" not found for this user.` });
    }

    const updatedGoal = await db.updateGoal(id, {
      text,
      time,
      isRepeatEnabled,
      repeatDays
    });

    console.log('✅ Goal updated:', updatedGoal);
    res.status(200).json({ success: true, updated: updatedGoal });
  } catch (error) {
    console.error('❌ Error updating goal:', error.message);
    res.status(500).json({ error: 'Failed to update goal.' });
  } finally {
    console.groupEnd();
  }
});

// Delete a goal
router.delete('/goal/:id', async (req, res) => {
  console.group('🗑️ [DELETE] Goal');
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const goalList = await db.getGoalsByUserId(userId);
    const goal = goalList.find(g => g.id === id);

    if (!goal) {
      console.warn('⚠️ Goal not found or does not belong to user:', id);
      return res.status(404).json({ error: `Goal with id "${id}" not found for this user.` });
    }

    const deletedGoal = await db.deleteGoal(id);
    console.log('✅ Goal deleted:', deletedGoal);
    res.status(200).json({ success: true, deleted: deletedGoal });
  } catch (error) {
    console.error('❌ Error deleting goal:', error.message);
    res.status(500).json({ error: 'Failed to delete goal.' });
  } finally {
    console.groupEnd();
  }
});

module.exports = router;
