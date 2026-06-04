export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_DATA: FaqItem[] = [
  {
    question: "Where does the data come from?",
    answer:
      "We ingest public box scores and team feeds from the NBA, EuroLeague and Liga ACB. Each league has its own pipeline that runs after tip-off and is normalized into the same per-game scale.",
  },
  {
    question: "Is the data live or delayed?",
    answer:
      "Stats are typically available within minutes of the final buzzer for NBA and EuroLeague games. ACB data lands a few hours after the game ends. The timestamps are visible in the player profile and the season dashboard.",
  },
  {
    question: "Do I need an account to browse?",
    answer:
      "No. The full directory — players, teams, coaches, comparisons and league hubs — is open during the public beta. You'll only need an account when we open the shortlist, scouting reports and AI advisor saving features.",
  },
  {
    question: "Which leagues are supported?",
    answer:
      "Today: the NBA, the EuroLeague and the Liga ACB. The WNBA, the NBL and selected national team competitions are on the roadmap.",
  },
  {
    question: "Can I compare a player from the NBA with one from EuroLeague?",
    answer:
      "Yes. We normalize pace and possessions across leagues so the comparison is fair. Open the Compare page, drop two names, and the radar, the shooting splits and the per-game lines will be apples-to-apples.",
  },
  {
    question: "What are advanced metrics and which ones do you expose?",
    answer:
      "We compute PER, Offensive / Defensive Rating, Net Rating, true shooting and pace at the team and player level when the underlying box score has the inputs (e.g. ACB has no FGA so offensive rating is not computed for ACB players).",
  },
  {
    question: "How much does it cost?",
    answer:
      "The public beta is free. We will introduce a paid tier for shortlists, exports, the AI advisor memory and live alerts, but the database and comparisons will stay open.",
  },
  {
    question: "Can I export or share a comparison?",
    answer:
      "Yes. The AI advisor and the compare page both support export to PDF, Excel and Word. Share links for shortlists are coming with the next release.",
  },
];
