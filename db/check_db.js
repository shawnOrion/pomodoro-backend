const {
  getAllUsers,
  getGoalsByUserId,
  getMessagesByUserId, // ✅ NEW
} = require('./queries');

const checkDatabase = async () => {
  try {
    console.group('🔎 Checking Database');

    const users = await getAllUsers();

    if (users.length === 0) {
      console.log('📭 No users found in the database.');
    } else {
      console.log('✅ Users found in database:');
      console.table(users);

      for (const user of users) {
        // === Goals
        const goals = await getGoalsByUserId(user.id);
        if (goals.length === 0) {
          console.log(`📭 No goals found for user ${user.username} (ID: ${user.id}).`);
        } else {
          console.log(`✅ Goals for user ${user.username} (ID: ${user.id}):`);
          console.table(goals);
        }

        // === Messages
        const messages = await getMessagesByUserId(user.id);
        if (messages.length === 0) {
          console.log(`📭 No messages found for user ${user.username} (ID: ${user.id}).`);
        } else {
          console.log(`📨 Messages for user ${user.username} (ID: ${user.id}):`);
          console.table(messages);
        }
      }
    }

    console.groupEnd();
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
};

checkDatabase();
