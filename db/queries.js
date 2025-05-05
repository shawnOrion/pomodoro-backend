const pool = require('./pool');

const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS Users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255), -- Raw password (optional, usually not used)
      hashed_password VARCHAR(255), -- Hashed password for security
      phone VARCHAR(20) UNIQUE NOT NULL,
      subscription_status VARCHAR(50) DEFAULT 'free',
      stripe_subscription_id TEXT
    );
  `;
  try {
    await pool.query(query);
    console.log('✅ Users table created successfully.');
  } catch (error) {
    console.error('❌ Error creating Users table:', error.message);
  }
};

const addSubscriptionFieldsToUsers = async () => {
  const query = `
    ALTER TABLE Users
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
  `;
  try {
    await pool.query(query);
    console.log('✅ Subscription fields added to Users table (if not already present).');
  } catch (error) {
    console.error('❌ Error altering Users table:', error.message);
    throw error;
  }
};

  
const dropUsersTable = async () => {
  const query = `DROP TABLE IF EXISTS Users CASCADE;`;
  try {
    await pool.query(query);
    console.log('✅ Users table dropped.');
  } catch (error) {
    console.error('❌ Error dropping Users table:', error.message);
    throw error;
  }
};
const dropGoalsTable = async () => {
  const query = `DROP TABLE IF EXISTS Goals CASCADE;`;
  try {
    await pool.query(query);
    console.log('✅ Goals table dropped.');
  } catch (error) {
    console.error('❌ Error dropping Goals table:', error.message);
    throw error;
  }
};

const insertUser = async (username, phone, hashedPassword) => {
  const query = `
    INSERT INTO Users (username, phone, hashed_password)
    VALUES ($1, $2, $3)
    RETURNING 
      id, 
      username, 
      phone, 
      subscription_status, 
      stripe_subscription_id;
  `;
  try {
    const { rows } = await pool.query(query, [username, phone, hashedPassword]);
    return rows[0];
  } catch (error) {
    console.error('❌ Error inserting user:', error.message);
    throw error;
  }
};


const getAllUsers = async () => {
    const query = `
      SELECT id, username, phone FROM Users;
    `;
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('❌ Error fetching users:', error.message);
      throw error;
    }
  };

  const getUserAuthDataByUsername = async (username) => {
    const query = `
      SELECT 
        id, 
        username, 
        phone, 
        hashed_password,
        subscription_status, 
        stripe_subscription_id
      FROM Users
      WHERE username = $1;
    `;
    try {
      const { rows } = await pool.query(query, [username]);
      return rows[0];
    } catch (error) {
      console.error('❌ Error fetching user by username:', error.message);
      throw error;
    }
  };
  
const getUserById = async (userId) => {
  const query = `
    SELECT 
      id, 
      username, 
      phone, 
      subscription_status, 
      stripe_subscription_id 
    FROM Users 
    WHERE id = $1;
  `;
  try {
    const { rows } = await pool.query(query, [userId]);
    if (rows.length === 0) {
      console.log(`⚠️ No user found with ID: ${userId}`);
      return null;
    }
    return rows[0];
  } catch (error) {
    console.error('❌ Error fetching user by ID:', error.message);
    throw error;
  }
};
  
const updateUser = async (userId, username, phone, hashedPassword = null, subscriptionStatus = null, stripeSubscriptionId = null) => {
  const query = `
    UPDATE Users
    SET 
      username = $1, 
      phone = $2, 
      hashed_password = COALESCE($3, hashed_password),
      subscription_status = COALESCE($4, subscription_status),
      stripe_subscription_id = COALESCE($5, stripe_subscription_id)
    WHERE id = $6
    RETURNING id, username, phone, subscription_status, stripe_subscription_id;
  `;
  try {
    const { rows } = await pool.query(query, [username, phone, hashedPassword, subscriptionStatus, stripeSubscriptionId, userId]);
    if (rows.length === 0) {
      console.log(`⚠️ No user found to update with ID: ${userId}`);
      return null;
    }
    return rows[0];
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    throw error;
  }
};

const deleteUser = async (userId) => {
  const query = `
    DELETE FROM Users WHERE id = $1 RETURNING id;
  `;
  try {
    const { rows } = await pool.query(query, [userId]);
    if (rows.length === 0) {
      console.log(`No user found to delete with ID: ${userId}`);
      return null;
    }
    return rows[0]; 
  } catch (error) {
    console.error('Error deleting user:', error.message);
    throw error;
  }
};
// Create Goals Table with user_id
const createGoalsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS Goals (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      time TIMESTAMPTZ NOT NULL,
      phone VARCHAR(20) NOT NULL,
      is_repeat_enabled BOOLEAN DEFAULT false,
      repeat_days INTEGER[] DEFAULT '{}',
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  try {
    await pool.query(query);
    console.log('✅ Goals table (with user_id) created successfully.');
  } catch (error) {
    console.error('❌ Error creating Goals table:', error.message);
  }
};

// Insert Goal (now expects user_id too!)
const insertGoal = async (goal) => {
  const { id, userId, text, time, phone, isRepeatEnabled = false, repeatDays = [], status = 'pending' } = goal;
  const query = `
    INSERT INTO Goals (id, user_id, text, time, phone, is_repeat_enabled, repeat_days, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  try {
    const { rows } = await pool.query(query, [
      id,
      userId,
      text,
      time,
      phone,
      isRepeatEnabled,
      repeatDays,
      status
    ]);
    return rows[0];
  } catch (error) {
    console.error('❌ Error inserting goal:', error.message);
    throw error;
  }
};

// Fetch all goals for a specific user
const getGoalsByUserId = async (userId) => {
  const query = `
    SELECT * FROM Goals
    WHERE user_id = $1;
  `;
  try {
    const { rows } = await pool.query(query, [userId]);
    return rows;
  } catch (error) {
    console.error('❌ Error fetching goals by user ID:', error.message);
    throw error;
  }
};

// Update a specific goal
const updateGoal = async (id, updates) => {
  const fieldMappings = {
    text: 'text',
    time: 'time',
    isRepeatEnabled: 'is_repeat_enabled', // ✅ map camelCase -> snake_case
    repeatDays: 'repeat_days',             // ✅ camelCase -> snake_case
    status: 'status'
  };

  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    const dbField = fieldMappings[key];
    if (!dbField) {
      console.warn(`⚠️ Skipping unknown update field: ${key}`);
      continue;
    }
    fields.push(`${dbField} = $${idx}`);
    values.push(value);
    idx++;
  }

  if (fields.length === 0) {
    console.warn('⚠️ No valid fields to update.');
    return null;
  }

  const query = `
    UPDATE Goals
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *;
  `;

  values.push(id);

  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('❌ Error updating goal:', error.message);
    throw error;
  }
};



// Delete a goal
const deleteGoal = async (id) => {
  const query = `
    DELETE FROM Goals
    WHERE id = $1
    RETURNING *;
  `;
  try {
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  } catch (error) {
    console.error('❌ Error deleting goal:', error.message);
    throw error;
  }
};
const getAllUserIds = async () => {
  const query = `SELECT id FROM Users;`;
  try {
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('❌ Error fetching all user IDs:', error.message);
    throw error;
  }
};

// 🔨 Create the Messages table
const createMessagesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS Messages (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  try {
    await pool.query(query);
    console.log('✅ Messages table created.');
  } catch (error) {
    console.error('❌ Error creating Messages table:', error.message);
  }
};

// 🧨 Drop the Messages table
const dropMessagesTable = async () => {
  const query = `DROP TABLE IF EXISTS Messages CASCADE;`;
  try {
    await pool.query(query);
    console.log('🗑️ Messages table dropped.');
  } catch (error) {
    console.error('❌ Error dropping Messages table:', error.message);
  }
};

// 📥 Insert a message
const insertMessage = async ({ id, userId, role, content }) => {
  const query = `
    INSERT INTO Messages (id, user_id, role, content)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  try {
    const { rows } = await pool.query(query, [id, userId, role, content]);
    return rows[0];
  } catch (error) {
    console.error('❌ Error inserting message:', error.message);
    throw error;
  }
};

// 📤 Get all messages for a user (ordered by creation time)
const getMessagesByUserId = async (userId) => {
  const query = `
    SELECT * FROM Messages
    WHERE user_id = $1
    ORDER BY created_at ASC;
  `;
  try {
    const { rows } = await pool.query(query, [userId]);
    return rows;
  } catch (error) {
    console.error('❌ Error fetching messages for user:', error.message);
    throw error;
  }
};

// 🗑️ Optional: Delete a message by ID
const deleteMessageById = async (id) => {
  const query = `
    DELETE FROM Messages
    WHERE id = $1
    RETURNING *;
  `;
  try {
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  } catch (error) {
    console.error('❌ Error deleting message:', error.message);
    throw error;
  }
};


module.exports = {
  insertUser,       
  getAllUsers,      
  getUserById,      
  updateUser,       
  deleteUser,       
  dropUsersTable,
  createUsersTable,
  getUserAuthDataByUsername,
  createGoalsTable,
  insertGoal,
  getGoalsByUserId,
  updateGoal,
  deleteGoal,
  dropGoalsTable,
  getAllUserIds,
  createMessagesTable,
  dropMessagesTable,
  insertMessage,
  getMessagesByUserId,
  deleteMessageById, 
  addSubscriptionFieldsToUsers
};