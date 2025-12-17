import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, generateAdminToken } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify admin credentials
    const isValid = verifyAdminCredentials(email, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Generate admin token
    const token = generateAdminToken(email);

    return NextResponse.json(
      {
        message: 'Admin login successful',
        token,
        admin: {
          email,
          isAdmin: true,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
