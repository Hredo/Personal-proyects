import { NextResponse } from 'next/server';
import { listTeamOptions } from '@/lib/data/teams';

export async function GET() {
  try {
    const teams = await listTeamOptions(500);
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching team options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}