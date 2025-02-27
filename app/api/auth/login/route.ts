'use server';

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Missing email or password' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 400 }
            );
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 400 }
            );
        }

        // Create a JWT token that expires in 1 hour
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Set the token in an HTTP-only cookie
        const response = NextResponse.json({ message: 'Logged in successfully' });
        response.cookies.set('token', token, {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });

        return response;
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}

