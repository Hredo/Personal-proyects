export type EuroleagueTeamMeta = {
  city: string
  arena: string
  logoUrl: string
  websiteUrl?: string
  foundedYear?: number
}

export const EUROLEAGUE_TEAM_META: Record<string, EuroleagueTeamMeta> = {
  MAD: {
    city: "Madrid",
    arena: "Palacio de Deportes de la Comunidad de Madrid (WiZink Center)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
    websiteUrl: "https://www.realmadrid.com",
    foundedYear: 1931,
  },
  BAR: {
    city: "Barcelona",
    arena: "Palau Blaugrana",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    websiteUrl: "https://www.fcbarcelona.com",
    foundedYear: 1926,
  },
  IST: {
    city: "Istanbul",
    arena: "Sinan Erdem Dome",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/0/04/Anadolu_Efes_logo.svg",
    websiteUrl: "https://www.anadoluefessk.org",
    foundedYear: 1976,
  },
  MUN: {
    city: "Munich",
    arena: "Audi Dome (BMW Park)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f5/Logo_FC_Bayern_M%C3%BCnchen_Basketball_ab_2022.png",
    websiteUrl: "https://fcbayern.com/basketball",
    foundedYear: 1946,
  },
  PAN: {
    city: "Athens",
    arena: "OAKA Altion (Peace and Friendship Stadium for EuroLeague)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/2/22/Panathinaikos_BC_logo.svg",
    websiteUrl: "https://www.paobc.gr",
    foundedYear: 1919,
  },
  OLY: {
    city: "Piraeus",
    arena: "Peace and Friendship Stadium (SEF)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/8/87/Olympiacos_BC_logo.svg",
    websiteUrl: "https://www.olympiacosbc.gr",
    foundedYear: 1931,
  },
  MCO: {
    city: "Monaco",
    arena: "Salle Gaston Médecin",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg",
    websiteUrl: "https://www.asm-rocket.com",
    foundedYear: 1928,
  },
  MIL: {
    city: "Milan",
    arena: "Unipol Forum (formerly Mediolanum Forum)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/c/c6/Olimpia_Milano_logo.svg",
    websiteUrl: "https://www.olimpiamilano.com",
    foundedYear: 1936,
  },
  VIR: {
    city: "Bologna",
    arena: "Virtus Arena (Segafredo Arena)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5f/Virtus_Bologna_logo.svg",
    websiteUrl: "https://www.virtus.it",
    foundedYear: 1927,
  },
  BAS: {
    city: "Vitoria-Gasteiz",
    arena: "Fernando Buesa Arena",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/d/d6/Saski_Baskonia_logo.svg",
    websiteUrl: "https://www.baskonia.com",
    foundedYear: 1959,
  },
  ULK: {
    city: "Istanbul",
    arena: "Ülker Sports Arena",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/7/7a/Fenerbah%C3%A7e_logo.svg",
    websiteUrl: "https://www.fenerbahce.org",
    foundedYear: 1913,
  },
  TEL: {
    city: "Tel Aviv",
    arena: "Menora Mivtachim Arena (or Belgrade Arena due to venue)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/c/c1/Maccabi_Tel_Aviv_BC_logo.svg",
    websiteUrl: "https://www.maccabi.co.il",
    foundedYear: 1932,
  },
  PAR: {
    city: "Belgrade",
    arena: "Štark Arena (Belgrade Arena)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/3/35/KK_Partizan_logo.svg",
    websiteUrl: "https://kkpartizan.rs",
    foundedYear: 1945,
  },
  RED: {
    city: "Belgrade",
    arena: "Štark Arena (Belgrade Arena)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/3/3b/KK_Crvena_zvezda_logo.svg",
    websiteUrl: "https://kkcrvenazvezda.rs",
    foundedYear: 1945,
  },
  ZAL: {
    city: "Kaunas",
    arena: "Žalgirio Arena",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/0/0a/BC_%C5%BDalgiris_logo.svg",
    websiteUrl: "https://www.zalgiris.lt",
    foundedYear: 1944,
  },
  ASV: {
    city: "Villeurbanne (Lyon)",
    arena: "LDLC Arena",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/0/0c/ASVEL_Lyon-Villeurbanne_logo.svg",
    websiteUrl: "https://www.asvel.com",
    foundedYear: 1948,
  },
  VAL: {
    city: "Valencia",
    arena: "La Fonteta (Pabellón Municipal Fuente de San Luis)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/4/4d/Valencia_Basket_logo.svg",
    websiteUrl: "https://www.valenciabasket.com",
    foundedYear: 1986,
  },
  BER: {
    city: "Berlin",
    arena: "Mercedes-Benz Arena (Uber Arena)",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/9/93/Alba_Berlin_logo.svg",
    websiteUrl: "https://www.albaberlin.de",
    foundedYear: 1991,
  },
  PRS: {
    city: "Paris",
    arena: "Adidas Arena",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Basketball_logo.svg",
    websiteUrl: "https://www.parisbasketball.com",
    foundedYear: 2018,
  },
}

export type EuroleagueCoach = {
  fullName: string
  role: "head_coach" | "assistant_coach" | "staff"
  nationality?: string
  age?: number
}

export const EUROLEAGUE_COACHES_2024_25: Record<string, EuroleagueCoach[]> = {
  MAD: [
    { fullName: "Chus Mateo", role: "head_coach", nationality: "Spain" },
  ],
  BAR: [
    { fullName: "Joan Peñarroya", role: "head_coach", nationality: "Spain" },
    { fullName: "Roger Grimau", role: "assistant_coach", nationality: "Spain" },
    { fullName: "Alfred Julbe", role: "assistant_coach", nationality: "Spain" },
  ],
  IST: [
    { fullName: "Erdem Can", role: "head_coach", nationality: "Turkey" },
    { fullName: "Burak Gören", role: "assistant_coach", nationality: "Turkey" },
  ],
  MUN: [
    { fullName: "Pablo Laso", role: "head_coach", nationality: "Spain" },
    { fullName: "Rene Spandauw", role: "assistant_coach", nationality: "Germany" },
  ],
  PAN: [
    { fullName: "Ergin Ataman", role: "head_coach", nationality: "Turkey" },
    { fullName: "Hakan Demirel", role: "assistant_coach", nationality: "Turkey" },
  ],
  OLY: [
    { fullName: "Georgios Bartzokas", role: "head_coach", nationality: "Greece" },
    { fullName: "Christos Serelis", role: "assistant_coach", nationality: "Greece" },
  ],
  MCO: [
    { fullName: "Saša Obradović", role: "head_coach", nationality: "Serbia" },
    { fullName: "Jasmin Repeša", role: "assistant_coach", nationality: "Croatia" },
  ],
  MIL: [
    { fullName: "Ettore Messina", role: "head_coach", nationality: "Italy" },
    { fullName: "Tomasso Fratesi", role: "assistant_coach", nationality: "Italy" },
  ],
  VIR: [
    { fullName: "Luca Banchi", role: "head_coach", nationality: "Italy" },
    { fullName: "Giampaolo Ricci", role: "assistant_coach", nationality: "Italy" },
  ],
  BAS: [
    { fullName: "Paolo Galbiati", role: "head_coach", nationality: "Italy" },
  ],
  ULK: [
    { fullName: "Šarūnas Jasikevičius", role: "head_coach", nationality: "Lithuania" },
    { fullName: "Ioannis Sfairopoulos", role: "assistant_coach", nationality: "Greece" },
  ],
  TEL: [
    { fullName: "Oded Kattash", role: "head_coach", nationality: "Israel" },
    { fullName: "Ariel Bet-Halahmi", role: "assistant_coach", nationality: "Israel" },
  ],
  PAR: [
    { fullName: "Željko Obradović", role: "head_coach", nationality: "Serbia" },
    { fullName: "Petar Božić", role: "assistant_coach", nationality: "Serbia" },
  ],
  RED: [
    { fullName: "Ioannis Sfairopoulos", role: "head_coach", nationality: "Greece" },
  ],
  ZAL: [
    { fullName: "Andrea Trinchieri", role: "head_coach", nationality: "Italy" },
    { fullName: "Kazys Maksvytis", role: "assistant_coach", nationality: "Lithuania" },
  ],
  ASV: [
    { fullName: "Pierric Poupet", role: "head_coach", nationality: "France" },
  ],
  VAL: [
    { fullName: "Pedro Martínez", role: "head_coach", nationality: "Spain" },
    { fullName: "Carles Marco", role: "assistant_coach", nationality: "Spain" },
  ],
  BER: [
    { fullName: "Israel González", role: "head_coach", nationality: "Spain" },
    { fullName: "Thomas Päch", role: "assistant_coach", nationality: "Germany" },
  ],
  PRS: [
    { fullName: "Tuomas Iisalo", role: "head_coach", nationality: "Finland" },
    { fullName: "Petri Virtanen", role: "assistant_coach", nationality: "Finland" },
  ],
}
