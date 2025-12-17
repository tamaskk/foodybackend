import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

export function authenticateToken(handler: (req: NextRequest & { user: TokenPayload }) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized - No token provided' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = verifyToken(token);

      if (!payload) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }

      // Attach user info to request
      const authenticatedReq = req as NextRequest & { user: TokenPayload };
      authenticatedReq.user = payload;

      return handler(authenticatedReq);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Token verification failed' },
        { status: 401 }
      );
    }
  };
}
