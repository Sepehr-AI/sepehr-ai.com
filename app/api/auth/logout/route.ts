'use server';

import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out successfully' });
    // Remove the token cookie
    response.cookies.delete('token', { path: '/' });
    return response;
}
