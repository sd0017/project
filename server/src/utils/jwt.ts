import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload: object): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
    return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '7d', algorithm: 'HS256' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
