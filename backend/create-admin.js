const bcrypt = require('bcryptjs');
const db = require('./config/db');

const ADMIN_NAME = 'System Administrator';
const ADMIN_EMAIL = 'marennavarpratika@gmail.com';
const ADMIN_PASSWORD = 'Admin@2026';

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

async function createAdmin() {
  try {

    if (!isStrongPassword(ADMIN_PASSWORD)) {
      throw new Error(
        'Password must contain at least 8 characters, ' +
        'one uppercase letter, one lowercase letter, ' +
        'one number and one special character.'
      );
    }

    const [existing] = await db.execute(
      `SELECT id FROM admins WHERE email = ? LIMIT 1`,
      [ADMIN_EMAIL]
    );

    if (existing.length > 0) {
      console.log(
        'Admin with this email already exists.'
      );

      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(
      ADMIN_PASSWORD,
      12
    );

    await db.execute(
      `INSERT INTO admins
      (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')`,
      [
        ADMIN_NAME,
        ADMIN_EMAIL,
        passwordHash
      ]
    );

    console.log('Admin created successfully.');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log('Password satisfies the required security policy.');

    process.exit(0);

  } catch (error) {

    console.error(
      'Failed to create admin:',
      error.message
    );

    process.exit(1);
  }
}

createAdmin();