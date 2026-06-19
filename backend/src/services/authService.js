'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const verifyPassword = (plainPassword, hash) => bcrypt.compare(plainPassword, hash);

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, 10);

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = { verifyPassword, hashPassword, generateToken, verifyToken };
