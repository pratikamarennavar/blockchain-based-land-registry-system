const db = require('../config/db');

const Admin = {
  async findByEmail(email) {
    const [rows] = await db.execute(
      `SELECT id, name, email, password_hash, role, status
       FROM admins
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT id, name, email, role, status, created_at, updated_at
       FROM admins
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0];
  }
};

module.exports = Admin;