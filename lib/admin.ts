import { NextRequest, NextResponse } from 'next/server';
import { generateToken, verifyToken } from './jwt';

export function generateAdminToken(adminEmail: string) {
  return generateToken({ adminEmail, isAdmin: true });
}

export function verifyAdminToken(token: string) {
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) {
    return null;
  }
  return payload;
}

export async function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { 
      error: NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 }), 
      admin: null 
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyAdminToken(token);

  if (!payload) {
    return { 
      error: NextResponse.json({ error: 'Unauthorized - Invalid admin token' }, { status: 401 }), 
      admin: null 
    };
  }

  return { error: null, admin: payload };
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Admin credentials not configured in .env');
    return false;
  }

  return email === adminEmail && password === adminPassword;
}
