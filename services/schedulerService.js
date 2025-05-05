// schedulerService.js
const cron = require('node-cron');
const db = require('../db/queries'); // ✅ Make sure this is imported

function startReminderScheduler({ io, sendSms, showDebugLogs = false }) {
  cron.schedule('* * * * * *', async () => {
    const now = new Date();

    // === Handle Goal Reminders (now from DB) ===
    try {
      const allUserIdsResult = await db.getAllUserIds();
      const allUserIds = allUserIdsResult.map(u => u.id);

      for (const userId of allUserIds) {
        const goals = await db.getGoalsByUserId(userId);

        for (const goal of goals) {
          if (goal.status === 'pending' && new Date(goal.time) <= now) {
            
            if (showDebugLogs) {
              console.log('🔔 [TRIGGERING REMINDER] Goal about to send:');
              console.table([{
                id: goal.id,
                text: goal.text,
                userId: goal.user_id,
                scheduledTime: goal.time,
                nowTime: now.toISOString()
              }]);
            }

            await processGoalReminder(goal, sendSms, showDebugLogs, io);
          }
        }
      }

    } catch (err) {
      console.error('❌ Error fetching goals from DB:', err.message);
    }

  })
  if (showDebugLogs) {
    console.log('🕒 Reminder scheduler started.');
  }
}

async function processGoalReminder(goal, sendSms, showDebugLogs, io) {
  const now = new Date();
  const scheduledTime = new Date(goal.time);
  const timeDiffMs = now - scheduledTime;
  const timeDiffMinutes = timeDiffMs / (60 * 1000);

  if (scheduledTime > now) return; // Future - skip
  if (timeDiffMinutes > 1) return; // Too old - skip

  // ✅ PREVENT DUPLICATE PROCESSING: lock the goal right away
  if (goal.status !== 'pending') {
    if (showDebugLogs) {
      console.log(`⏩ [SKIP] Goal "${goal.id}" already ${goal.status}`);
    }
    return;
  }

  // 🔒 Mark as processing immediately in DB so next cron tick skips it
  await db.updateGoal(goal.id, { status: 'processing' });

  if (showDebugLogs) {
    console.log(`📲 [GOAL SMS] Sending SMS for Goal "${goal.id}" scheduled at ${goal.time}`);
  }

  try {
    await sendSms({ to: goal.phone, message: goal.text });
    console.log(`✅ SMS sent for goal ${goal.id}`);

    if (goal.is_repeat_enabled && Array.isArray(goal.repeat_days) && goal.repeat_days.length > 0) {
      const nextTime = getNextRepeatTime(goal);
      await db.updateGoal(goal.id, {
        time: nextTime,
        isRepeatEnabled: true,
        repeatDays: goal.repeat_days,
        status: 'pending'
      });
    } else {
      await db.updateGoal(goal.id, { status: 'sent' });
    }

    io.emit('reminder_done', {
      id: goal.id,
      message: goal.text,
      completedAt: new Date(),
    });

  } catch (err) {
    console.error(`❌ Failed to send SMS for goal ${goal.id}: ${err.message}`);
    await db.updateGoal(goal.id, { status: 'failed' });
  }
}


// 🔥 Helper for recurring goals
function getNextRepeatTime(goal) {
  const now = new Date();
  const currentDay = now.getDay();
  const repeatDaysSorted = goal.repeat_days.sort((a, b) => a - b);

  let daysUntilNext = null;

  for (let day of repeatDaysSorted) {
    if (day > currentDay) {
      daysUntilNext = day - currentDay;
      break;
    }
  }

  if (daysUntilNext === null) {
    daysUntilNext = (7 - currentDay) + repeatDaysSorted[0];
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntilNext);
  const originalGoalDate = new Date(goal.time);
  nextDate.setHours(originalGoalDate.getHours());
  nextDate.setMinutes(originalGoalDate.getMinutes());
  nextDate.setSeconds(0);
  nextDate.setMilliseconds(0);

  return nextDate.toISOString();
}

module.exports = {
  startReminderScheduler,
};
