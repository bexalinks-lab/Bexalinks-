// password-utils.js
// Salted scrypt password hashing using Node's built-in crypto module —
// no extra dependency (bcrypt) required. Stored format: "<salt>:<hash>",
// both hex-encoded, so it fits in the existing users.password_hash column.

const crypto = require('crypto');

const KEY_LEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  try {
    const hashBuffer = Buffer.from(hash, 'hex');
    const suppliedBuffer = crypto.scryptSync(password, salt, KEY_LEN);
    if (hashBuffer.length !== suppliedBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, suppliedBuffer);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
