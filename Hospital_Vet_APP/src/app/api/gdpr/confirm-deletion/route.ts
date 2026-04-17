import { auth } from '@/auth';
import db from '@/lib/db';
import { executeDataDeletion, logAuditEvent } from '@/lib/gdpr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    const success = executeDataDeletion(session.user.id, token);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Account and all personal data permanently deleted',
    });
  } catch (error) {
    console.error('Deletion confirmation failed:', error);
    return NextResponse.json(
      { error: 'Confirmation failed' },
      { status: 500 }
    );
  }
}
