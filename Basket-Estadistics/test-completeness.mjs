import { getDb } from './src/lib/db/client.ts';
import { players, leagues, teams } from './src/lib/db/schema.ts';
import { eq, sql, isNull, and } from 'drizzle-orm';

async function main() {
  const db = getDb();
  const allLeagues = await db.select().from(leagues);

  for (const l of allLeagues) {
    const source = l.source;
    const total = await db.select({ c: sql`count(*)` })
      .from(players)
      .where(eq(players.source, source));
    const missingPhoto = await db.select({ c: sql`count(*)` })
      .from(players)
      .where(and(eq(players.source, source), isNull(players.photoUrl)));
    const missingNat = await db.select({ c: sql`count(*)` })
      .from(players)
      .where(and(eq(players.source, source), isNull(players.nationality)));
    const missingPos = await db.select({ c: sql`count(*)` })
      .from(players)
      .where(and(eq(players.source, source), isNull(players.position)));
    const missingH = await db.select({ c: sql`count(*)` })
      .from(players)
      .where(and(eq(players.source, source), isNull(players.heightCm)));
    const noTeam = await db.select({ c: sql`count(*)` })
      .from(players)
      .where(and(eq(players.source, source), isNull(players.currentTeamId)));

    console.log(`=== ${l.name} (${source}) ===`);
    console.log(`  Total: ${total[0].c}`);
    console.log(`  Missing photo: ${missingPhoto[0].c}`);
    console.log(`  Missing nationality: ${missingNat[0].c}`);
    console.log(`  Missing position: ${missingPos[0].c}`);
    console.log(`  Missing height: ${missingH[0].c}`);
    console.log(`  No team: ${noTeam[0].c}`);
  }

  console.log("\n=== Teams ===");
  for (const l of allLeagues) {
    const leagueId = l.id;
    const total = await db.select({ c: sql`count(*)` })
      .from(teams).where(eq(teams.leagueId, leagueId));
    const noLogo = await db.select({ c: sql`count(*)` })
      .from(teams).where(and(eq(teams.leagueId, leagueId), isNull(teams.logoUrl)));
    const noCity = await db.select({ c: sql`count(*)` })
      .from(teams).where(and(eq(teams.leagueId, leagueId), isNull(teams.city)));
    const noArena = await db.select({ c: sql`count(*)` })
      .from(teams).where(and(eq(teams.leagueId, leagueId), isNull(teams.arena)));
    console.log(`  ${l.name}: ${total[0].c} teams, ${noLogo[0].c} no logo, ${noCity[0].c} no city, ${noArena[0].c} no arena`);
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
