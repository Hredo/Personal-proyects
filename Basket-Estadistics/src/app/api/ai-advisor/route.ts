import { NextResponse } from 'next/server';
import { getTeamBySlug } from '@/lib/data/teams';
import { buildLocalAdvice } from '@/lib/ai/local-advisor';

export type AdvisorRequest = {
  teamSlug: string;
  leagueSlug: string;
  userMessage: string;
};

export async function POST(request: Request) {
  try {
    const body: AdvisorRequest = await request.json();

    if (!body.teamSlug || !body.leagueSlug || !body.userMessage) {
      return NextResponse.json(
        { content: 'Faltan datos del equipo o la pregunta.' },
        { status: 400 }
      );
    }

    const team = await getTeamBySlug(body.leagueSlug, body.teamSlug);
    if (!team) {
      return NextResponse.json({ content: `No se encontró el equipo en ${body.leagueSlug}.` });
    }

    const data = buildLocalAdvice(team, body.userMessage);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('AI advisor error:', error);
    return NextResponse.json({
      content: 'Ocurrió un error al procesar la consulta. Por favor, intenta de nuevo.'
    });
  }
}
