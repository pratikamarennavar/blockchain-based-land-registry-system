const db = require('./config/db');

async function testDatabase() {
  try {
    const connection = await db.getConnection();

    console.log('MySQL connected successfully');

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    process.exit(1);
  }
}

testDatabase();