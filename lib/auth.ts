import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export function authenticate(req: NextRequest): JwtPayload | string | null {
    const token = req.cookies.get('token')?.value;
    if (!token) {
        return null;
    }
    try {
        // Verify the token and return its payload
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export function requireAuth(req: NextRequest): JwtPayload | string {
    const user = authenticate(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return user;
}
