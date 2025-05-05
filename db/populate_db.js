const {
  dropUsersTable,
  dropMessagesTable,
  dropGoalsTable,
  createUsersTable,
  createGoalsTable,
  createMessagesTable,
  insertUser,
  insertGoal,
  addSubscriptionFieldsToUsers // 👈 new
} = require('./queries');

const seedData = async () => {
  try {
    console.group('🌱 Seeding Database');


    // Step 3: Run the migration for Users table
    await addSubscriptionFieldsToUsers();

    console.groupEnd();
    console.log('🌟 Seed data inserted successfully.');
  } catch (error) {
    console.error('❌ Error during database seeding:', error.message);
  }
};

seedData();
