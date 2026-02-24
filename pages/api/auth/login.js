const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const router = express.Router();

// Dummy admin credentials; replace with your database in production
const adminUser = {
  username: 'admin',
  password: '$2b$10$Ez7Z1c7ShhLMFAnV92BePUBN0H41HqGFwP5OP9g8e6/gl/5G5Bu2W' // hashed password for 'password123'
};

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if username matches
  if (username !== adminUser.username) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  
  // Check password
  const match = await bcrypt.compare(password, adminUser.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Create JWT token
  const token = jwt.sign({ username: adminUser.username }, 'secret_key', { expiresIn: '1h' }); // Replace 'secret_key' with your secret

  res.json({ token });
});

module.exports = router;
