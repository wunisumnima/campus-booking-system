const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key';

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Format: Bearer token
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

module.exports = verifyToken;
