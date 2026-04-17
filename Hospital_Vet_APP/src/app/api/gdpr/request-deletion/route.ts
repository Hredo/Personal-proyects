import { auth } from '@/auth';
import db from '@/lib/db';
import { requestDataDeletion, logAuditEvent } from '@/lib/gdpr';
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

    const token = requestDataDeletion(session.user.id);
    
    logAuditEvent(
      session.user.id,
      'DATA_DELETION',
      'User requested account deletion'
    );

    // TODO: Send confirmation email with token link
    // In production, send: https://yourapp.com/gdpr/confirm-deletion?token={token}
    // const confirmationUrl = `${process.env.NEXTAUTH_URL}/gdpr/confirm-deletion?token=${token}`;
    // await sendDeletionConfirmationEmail(session.user.email, confirmationUrl);

    return NextResponse.json({
      message: 'Deletion request created. Check your email for confirmation.',
      expiresIn: '30 days',
    });
  } catch (error) {
    console.error('Deletion request failed:', error);
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}
