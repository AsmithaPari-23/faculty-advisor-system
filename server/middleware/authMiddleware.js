import jwt from 'jsonwebtoken';
import { User } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecurecyberkey';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'User associated with token no longer exists' });
    }

    next();
  } catch (error) {
    console.error('Token validation error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this route`
      });
    }
    next();
  };
};
