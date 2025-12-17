import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '365d'; // 1 year

export interface TokenPayload {
  userId?: string;
  email?: string;
  username?: string;
  adminEmail?: string;
  isAdmin?: boolean;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}

