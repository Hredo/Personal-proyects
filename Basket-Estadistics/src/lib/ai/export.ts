import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  ShadingType,
  BorderStyle,
} from "docx";
import type { AdvisorOutput } from "@/lib/ai/local-advisor";

export type ChatMessage = {
  id: number;
  type: "user" | "ai";
  content: string;
  data?: AdvisorOutput;
};

export type TeamContext = {
  name: string;
  slug: string;
  leagueSlug: string;
  leagueName?: string;
};

export type ExportPayload = {
  team: TeamContext;
  messages: ChatMessage[];
  generatedAt?: Date;
};

const FILE_BASE = "asesor-fichajes";

const COLORS = {
  headerBg: "111827",
  headerFg: "FFFFFF",
  brand: "F59E0B",
  brandDark: "B45309",
  bandBg: "1F2937",
  bandFg: "FFFFFF",
  zebra: "F9FAFB",
  border: "D1D5DB",
  subHeaderBg: "FEF3C7",
  text: "111827",
  muted: "6B7280",
  cardBg: "FFF7ED",
  cardBorder: "FCD34D",
};

const PRIORITY_HEX: Record<string, { bg: string; fg: string }> = {
  brand: { bg: "FEF3C7", fg: "B45309" },
  emerald: { bg: "D1FAE5", fg: "065F46" },
  cyan: { bg: "CFFAFE", fg: "155E75" },
  blue: { bg: "DBEAFE", fg: "1E40AF" },
  red: { bg: "FEE2E2", fg: "991B1B" },
  rose: { bg: "FFE4E6", fg: "9F1239" },
  amber: { bg: "FEF3C7", fg: "92400E" },
  yellow: { bg: "FEF9C3", fg: "854D0E" },
  slate: { bg: "F1F5F9", fg: "334155" },
  purple: { bg: "EDE9FE", fg: "5B21B6" },
  pink: { bg: "FCE7F3", fg: "9D174D" },
  teal: { bg: "CCFBF1", fg: "115E59" },
  zinc: { bg: "F4F4F5", fg: "3F3F46" },
};

function priorityColorFromTailwind(cls: string): { bg: string; fg: string } {
  const match = cls.match(/(bg|text|border)-([a-z]+)-/);
  const name = match?.[2] ?? "slate";
  return PRIORITY_HEX[name] ?? PRIORITY_HEX.slate;
}

type Border = {
  top?: { style: "thin" | "medium" | "thick"; color: { rgb: string } };
  bottom?: { style: "thin" | "medium" | "thick"; color: { rgb: string } };
  left?: { style: "thin" | "medium" | "thick"; color: { rgb: string } };
  right?: { style: "thin" | "medium" | "thick"; color: { rgb: string } };
};

type XLSXStyle = {
  font?: { name?: string; sz?: number; bold?: boolean; italic?: boolean; color?: { rgb: string } };
  fill?: { patternType: "solid"; fgColor: { rgb: string } };
  alignment?: { horizontal?: "left" | "center" | "right"; vertical?: "top" | "center" | "bottom"; wrapText?: boolean; indent?: number };
  border?: Border;
  numFmt?: string;
};

const thinBorder: Border = {
  top: { style: "thin", color: { rgb: COLORS.border } },
  bottom: { style: "thin", color: { rgb: COLORS.border } },
  left: { style: "thin", color: { rgb: COLORS.border } },
  right: { style: "thin", color: { rgb: COLORS.border } },
};

const STYLES = {
  bannerTitle: {
    font: { name: "Calibri", sz: 28, bold: true, color: { rgb: COLORS.headerFg } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.headerBg } },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  } satisfies XLSXStyle,
  bannerSubtitle: {
    font: { name: "Calibri", sz: 11, italic: true, color: { rgb: COLORS.headerFg } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.headerBg } },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  } satisfies XLSXStyle,
  brandBar: {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.headerFg } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.brand } },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  } satisfies XLSXStyle,
  sectionHeader: {
    font: { name: "Calibri", sz: 12, bold: true, color: { rgb: COLORS.text } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.subHeaderBg } },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
    border: thinBorder,
  } satisfies XLSXStyle,
  cardLabel: {
    font: { name: "Calibri", sz: 9, bold: true, color: { rgb: COLORS.brandDark } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.cardBg } },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
    border: {
      top: { style: "thin", color: { rgb: COLORS.cardBorder } },
      bottom: { style: "thin", color: { rgb: COLORS.cardBorder } },
      left: { style: "medium", color: { rgb: COLORS.cardBorder } },
      right: { style: "thin", color: { rgb: COLORS.cardBorder } },
    },
  } satisfies XLSXStyle,
  cardValue: {
    font: { name: "Calibri", sz: 14, bold: true, color: { rgb: COLORS.text } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.cardBg } },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
    border: {
      top: { style: "thin", color: { rgb: COLORS.cardBorder } },
      bottom: { style: "thin", color: { rgb: COLORS.cardBorder } },
      left: { style: "thin", color: { rgb: COLORS.cardBorder } },
      right: { style: "medium", color: { rgb: COLORS.cardBorder } },
    },
  } satisfies XLSXStyle,
  tableHeader: {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.headerFg } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.brand } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: thinBorder,
  } satisfies XLSXStyle,
  cell: {
    font: { name: "Calibri", sz: 11, color: { rgb: COLORS.text } },
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
    border: thinBorder,
  } satisfies XLSXStyle,
  cellZebra: {
    font: { name: "Calibri", sz: 11, color: { rgb: COLORS.text } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.zebra } },
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
    border: thinBorder,
  } satisfies XLSXStyle,
  cellCenter: {
    font: { name: "Calibri", sz: 11, color: { rgb: COLORS.text } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: thinBorder,
  } satisfies XLSXStyle,
  cellCenterZebra: {
    font: { name: "Calibri", sz: 11, color: { rgb: COLORS.text } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.zebra } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: thinBorder,
  } satisfies XLSXStyle,
  meta: {
    font: { name: "Calibri", sz: 10, italic: true, color: { rgb: COLORS.muted } },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  } satisfies XLSXStyle,
  body: {
    font: { name: "Calibri", sz: 11, color: { rgb: COLORS.text } },
    alignment: { horizontal: "left", vertical: "top", wrapText: true, indent: 1 },
    border: thinBorder,
  } satisfies XLSXStyle,
};

type SheetCell = { v: string | number | null | undefined; s?: XLSXStyle };
type SheetRow = SheetCell[];

function timestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}` +
    `${pad(date.getMonth() + 1)}` +
    `${pad(date.getDate())}` +
    `-${pad(date.getHours())}` +
    `${pad(date.getMinutes())}` +
    `${pad(date.getSeconds())}`
  );
}

function safeFilePart(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "equipo"
  );
}

function buildFileName(teamName: string, ext: string): string {
  return `${FILE_BASE}-${safeFilePart(teamName)}-${timestamp()}.${ext}`;
}

function formatDate(date: Date): string {
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripMarkdown(input: string): string {
  return input
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

function collectRecommendations(messages: ChatMessage[]) {
  const recs: AdvisorOutput["recommendations"] = [];
  for (const m of messages) {
    if (m.type === "ai" && m.data?.recommendations) {
      for (const r of m.data.recommendations) recs.push(r);
    }
  }
  return recs;
}

function lastAdvisorOutput(messages: ChatMessage[]): AdvisorOutput | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.type === "ai" && m.data) return m.data;
  }
  return null;
}

function padRow(row: SheetRow, width: number): SheetRow {
  if (row.length >= width) return row;
  const padded = [...row];
  while (padded.length < width) padded.push({ v: "" });
  return padded;
}

function applyStyles(
  ws: XLSX.WorkSheet,
  rows: SheetRow[],
  opts: { freezeFirstRow?: boolean; autofilter?: boolean } = {},
): void {
  for (const [addr, cell] of Object.entries(ws)) {
    if (addr.startsWith("!") || !cell) continue;
    const { r, c } = XLSX.utils.decode_cell(addr);
    const row = rows[r];
    if (!row) continue;
    const col = row[c];
    if (col?.s) (cell as XLSX.CellObject).s = col.s as XLSX.CellStyle;
  }
  if (opts.freezeFirstRow) {
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  }
  if (opts.autofilter && ws["!ref"]) {
    ws["!autofilter"] = { ref: ws["!ref"] };
  }
  ws["!pageSetup"] = {
    orientation: "landscape",
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
  };
}

function buildCoverSheet(payload: ExportPayload): XLSX.WorkSheet {
  const { team, messages, generatedAt = new Date() } = payload;
  const last = lastAdvisorOutput(messages);
  const recs = collectRecommendations(messages);
  const W = 3;

  type RowEntry = { row: SheetRow; fullWidth: boolean };
  const entries: RowEntry[] = [];

  const push = (row: SheetRow, fullWidth: boolean): void => {
    entries.push({ row, fullWidth });
  };

  push(padRow([{ v: "ASESOR DE FICHAJES", s: STYLES.bannerTitle }], W), true);
  push(padRow([{ v: "Informe generado por Basket Estadísticas", s: STYLES.bannerSubtitle }], W), true);
  push(padRow([{ v: "" }], W), true);

  push(padRow([{ v: "FICHA DEL EQUIPO", s: STYLES.brandBar }], W), true);
  push(
    padRow(
      [
        { v: team.name, s: STYLES.cardValue },
        { v: team.leagueName ?? team.leagueSlug, s: STYLES.cardValue },
        { v: formatDate(generatedAt), s: STYLES.cardValue },
      ],
      W,
    ),
    false,
  );
  push(
    padRow(
      [
        { v: "EQUIPO", s: STYLES.cardLabel },
        { v: "LIGA", s: STYLES.cardLabel },
        { v: "GENERADO", s: STYLES.cardLabel },
      ],
      W,
    ),
    false,
  );
  push(padRow([{ v: "" }], W), true);

  push(padRow([{ v: "RESUMEN", s: STYLES.brandBar }], W), true);
  const recCount = recs.length;
  const considerations = last?.considerations.length ?? 0;
  push(
    padRow(
      [
        { v: messages.length, s: STYLES.cardValue },
        { v: recCount, s: STYLES.cardValue },
        { v: considerations, s: STYLES.cardValue },
      ],
      W,
    ),
    false,
  );
  push(
    padRow(
      [
        { v: "MENSAJES", s: STYLES.cardLabel },
        { v: "CANDIDATOS", s: STYLES.cardLabel },
        { v: "CONSIDERACIONES", s: STYLES.cardLabel },
      ],
      W,
    ),
    false,
  );
  push(padRow([{ v: "" }], W), true);

  if (last) {
    push(padRow([{ v: "INTENCIÓN DEL ANÁLISIS", s: STYLES.sectionHeader }], W), true);
    push(
      padRow(
        [
          {
            v: `${last.intentEmoji}  ${last.intentLabel}`,
            s: {
              font: { name: "Calibri", sz: 22, bold: true, color: { rgb: COLORS.brandDark } },
              fill: { patternType: "solid", fgColor: { rgb: COLORS.cardBg } },
              alignment: { horizontal: "left", vertical: "center", indent: 1 },
              border: thinBorder,
            },
          },
        ],
        W,
      ),
      true,
    );
    push(padRow([{ v: "" }], W), true);

    push(padRow([{ v: "ANÁLISIS", s: STYLES.sectionHeader }], W), true);
    push(
      padRow(
        [
          {
            v: stripMarkdown(last.analysis),
            s: { ...STYLES.body, font: { name: "Calibri", sz: 12, color: { rgb: COLORS.text } } },
          },
        ],
        W,
      ),
      true,
    );
    push(padRow([{ v: "" }], W), true);

    push(padRow([{ v: "HUECO DETECTADO", s: STYLES.sectionHeader }], W), true);
    push(
      padRow(
        [
          {
            v: last.gap,
            s: { ...STYLES.body, font: { name: "Calibri", sz: 12, color: { rgb: COLORS.text } } },
          },
        ],
        W,
      ),
      true,
    );
    push(padRow([{ v: "" }], W), true);

    push(padRow([{ v: "NÚCLEO ACTUAL", s: STYLES.sectionHeader }], W), true);
    push(
      padRow(
        [
          {
            v: last.team.topPlayers.length > 0 ? last.team.topPlayers.join(" · ") : "—",
            s: { ...STYLES.body, font: { name: "Calibri", sz: 12, color: { rgb: COLORS.text } } },
          },
        ],
        W,
      ),
      true,
    );
    push(padRow([{ v: "" }], W), true);

    if (last.considerations.length > 0) {
      push(padRow([{ v: "ANTES DE NEGOCIAR", s: STYLES.sectionHeader }], W), true);
      for (const c of last.considerations) {
        push(
          padRow(
            [
              {
                v: `•  ${c}`,
                s: { ...STYLES.body, font: { name: "Calibri", sz: 11, color: { rgb: COLORS.text } } },
              },
            ],
            W,
          ),
          true,
        );
      }
    }
  }

  const rows = entries.map((e) => e.row);

  const ws = XLSX.utils.aoa_to_sheet(rows.map((r) => r.map((c) => c.v)));
  ws["!cols"] = [
    { wch: 36 },
    { wch: 36 },
    { wch: 36 },
  ];
  ws["!merges"] = entries
    .map((e, i) =>
      e.fullWidth ? { s: { c: 0, r: i }, e: { c: W - 1, r: i } } : null,
    )
    .filter((m): m is XLSX.Range => m !== null);

  for (const [addr, cell] of Object.entries(ws)) {
    if (addr.startsWith("!") || !cell) continue;
    const { r, c } = XLSX.utils.decode_cell(addr);
    const row = rows[r];
    if (!row) continue;
    const col = row[c];
    if (col?.s) (cell as XLSX.CellObject).s = col.s as XLSX.CellStyle;
  }
  return ws;
}

function buildRecommendationsSheet(payload: ExportPayload): XLSX.WorkSheet {
  const recs = collectRecommendations(payload.messages);
  const header = [
    "#",
    "Jugador",
    "Posición",
    "Liga",
    "Edad",
    "Contrato",
    "Prioridad",
    "Mercado",
    "Encaje",
    "Puntos fuertes",
  ];
  const data: SheetRow[] = [
    header.map((h) => ({ v: h, s: STYLES.tableHeader })),
  ];
  if (recs.length === 0) {
    data.push([
      { v: "—", s: STYLES.cell },
      { v: "Sin recomendaciones en esta conversación.", s: STYLES.cell },
      ...Array(header.length - 2).fill({ v: "", s: STYLES.cell }),
    ]);
  } else {
    recs.forEach((r, i) => {
      const zebra = i % 2 === 0 ? STYLES.cell : STYLES.cellZebra;
      const zebraCenter = i % 2 === 0 ? STYLES.cellCenter : STYLES.cellCenterZebra;
      const { bg, fg } = priorityColorFromTailwind(r.priorityColor);
      const priorityStyle: XLSXStyle = {
        font: { name: "Calibri", sz: 11, bold: true, color: { rgb: fg } },
        fill: { patternType: "solid", fgColor: { rgb: bg } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: thinBorder,
      };
      data.push([
        { v: i + 1, s: zebraCenter },
        { v: r.name, s: { ...zebra, font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.text } } } },
        { v: r.position, s: zebra },
        { v: r.league, s: zebraCenter },
        { v: r.age, s: zebraCenter },
        { v: r.contractValue, s: zebraCenter },
        { v: r.priority, s: priorityStyle },
        { v: r.market, s: zebra },
        { v: r.fit, s: zebra },
        { v: r.strengths.length > 0 ? r.strengths.map((s) => `• ${s}`).join("\n") : "—", s: zebra },
      ]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(data.map((r) => r.map((c) => c.v)));
  ws["!cols"] = [
    { wch: 4 },
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 7 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 50 },
    { wch: 50 },
  ];
  ws["!rows"] = [{ hpt: 32 }];
  applyStyles(ws, data, { freezeFirstRow: true, autofilter: true });
  return ws;
}

function buildPlayerCardsSheet(payload: ExportPayload): XLSX.WorkSheet {
  const recs = collectRecommendations(payload.messages);
  const data: SheetRow[] = [];

  const title = (text: string): SheetCell => ({ v: text, s: STYLES.bannerTitle });
  const sub = (text: string): SheetCell => ({ v: text, s: STYLES.brandBar });
  const label = (text: string): SheetCell => ({ v: text, s: STYLES.cardLabel });
  const value = (text: string): SheetCell => ({ v: text, s: STYLES.cardValue });

  if (recs.length === 0) {
    data.push([title("Fichas de jugadores")]);
    data.push([label("Sin fichas en esta conversación.")]);
  } else {
    data.push([title(`Fichas de jugadores — ${recs.length} candidatos`)]);
    data.push([label("")]);
    data.push([label("")]);

    recs.forEach((r, i) => {
      const { bg, fg } = priorityColorFromTailwind(r.priorityColor);
      const priorityBadge: XLSXStyle = {
        font: { name: "Calibri", sz: 11, bold: true, color: { rgb: fg } },
        fill: { patternType: "solid", fgColor: { rgb: bg } },
        alignment: { horizontal: "center", vertical: "center" },
        border: thinBorder,
      };
      data.push([sub(`Jugador ${i + 1} — ${r.name}`)]);
      data.push([label("Posición"), value(r.position)]);
      data.push([label("Liga"), value(r.league)]);
      data.push([label("Edad"), value(`${r.age} años`)]);
      data.push([label("Contrato estimado"), value(r.contractValue)]);
      data.push([label("Mercado"), value(r.market)]);
      data.push([label("Prioridad"), { v: r.priority, s: priorityBadge }]);
      data.push([label("Encaje"), value(r.fit)]);
      data.push([label("Puntos fuertes"), value(r.strengths.length > 0 ? r.strengths.map((s) => `• ${s}`).join("\n") : "—")]);
      data.push([label("")]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(data.map((r) => r.map((c) => c.v)));
  ws["!cols"] = [{ wch: 24 }, { wch: 95 }];
  ws["!rows"] = [{ hpt: 36 }];

  for (const [addr, cell] of Object.entries(ws)) {
    if (addr.startsWith("!") || !cell) continue;
    const { r, c } = XLSX.utils.decode_cell(addr);
    const row = data[r];
    if (!row) continue;
    const col = row[c];
    if (col?.s) (cell as XLSX.CellObject).s = col.s as XLSX.CellStyle;
  }
  ws["!pageSetup"] = {
    orientation: "portrait",
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
  };
  return ws;
}

function buildConversationSheet(payload: ExportPayload): XLSX.WorkSheet {
  const { messages } = payload;
  const header = ["#", "Tipo", "Mensaje"];
  const data: SheetRow[] = [
    header.map((h) => ({ v: h, s: STYLES.tableHeader })),
  ];
  messages.forEach((m, i) => {
    const cleaned = m.data ? buildAdvisorText(m.data) : stripMarkdown(m.content);
    const isAi = m.type === "ai";
    const cellBase: XLSXStyle = {
      font: { name: "Calibri", sz: 11, color: { rgb: COLORS.text } },
      fill: {
        patternType: "solid",
        fgColor: { rgb: isAi ? "FFFBEB" : "F9FAFB" },
      },
      alignment: { horizontal: "left", vertical: "top", wrapText: true, indent: 1 },
      border: thinBorder,
    };
    const typeBase: XLSXStyle = {
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: isAi ? COLORS.brandDark : COLORS.muted } },
      fill: {
        patternType: "solid",
        fgColor: { rgb: isAi ? COLORS.subHeaderBg : "F3F4F6" },
      },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder,
    };
    const idxBase: XLSXStyle = {
      font: { name: "Calibri", sz: 10, color: { rgb: COLORS.muted } },
      alignment: { horizontal: "center", vertical: "top" },
      border: thinBorder,
    };
    data.push([
      { v: i + 1, s: idxBase },
      { v: isAi ? "Asesor" : "Usuario", s: typeBase },
      { v: cleaned, s: cellBase },
    ]);
  });
  if (messages.length === 0) {
    data.push([
      { v: "—", s: STYLES.cell },
      { v: "—", s: STYLES.cell },
      { v: "Sin mensajes en esta conversación.", s: STYLES.cell },
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data.map((r) => r.map((c) => c.v)));
  ws["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 100 }];
  ws["!rows"] = [{ hpt: 30 }];
  applyStyles(ws, data, { freezeFirstRow: true, autofilter: true });
  return ws;
}

function buildAdvisorText(data: AdvisorOutput): string {
  const lines: string[] = [];
  lines.push(`${data.intentEmoji} ${data.intentLabel}`);
  lines.push("");
  lines.push(stripMarkdown(data.analysis));
  lines.push("");
  lines.push(`Hueco detectado: ${data.gap}`);
  lines.push("");
  lines.push("Candidatos:");
  data.recommendations.forEach((r, i) => {
    lines.push(
      `  ${i + 1}. ${r.name} (${r.position}, ${r.league}, ${r.age} años) — ${r.contractValue} [${r.priority}]`,
    );
    lines.push(`     Encaje: ${r.fit}`);
    if (r.strengths.length > 0) {
      lines.push(`     Puntos fuertes: ${r.strengths.join(", ")}`);
    }
  });
  if (data.considerations.length > 0) {
    lines.push("");
    lines.push("Consideraciones:");
    for (const c of data.considerations) lines.push(`  - ${c}`);
  }
  return lines.join("\n");
}

export function exportToExcel(payload: ExportPayload): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildCoverSheet(payload), "Portada");
  XLSX.utils.book_append_sheet(wb, buildRecommendationsSheet(payload), "Recomendaciones");
  XLSX.utils.book_append_sheet(wb, buildPlayerCardsSheet(payload), "Fichas");
  XLSX.utils.book_append_sheet(wb, buildConversationSheet(payload), "Conversación");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, buildFileName(payload.team.name, "xlsx"));
}

export function exportToPdf(payload: ExportPayload): void {
  const { team, messages, generatedAt = new Date() } = payload;
  const recs = collectRecommendations(messages);
  const last = lastAdvisorOutput(messages);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const addHeader = () => {
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 60, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Asesor de Fichajes — Informe", margin, 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(formatDate(generatedAt), margin, 45);
    doc.setTextColor(0, 0, 0);
    y = 80;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      addHeader();
    }
  };

  addHeader();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Equipo: ${team.name}`, margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Liga: ${team.leagueName ?? team.leagueSlug}`, margin, y);
  y += 14;
  doc.text(`Mensajes: ${messages.length}    Recomendaciones: ${recs.length}`, margin, y);
  y += 18;

  if (last) {
    ensureSpace(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Diagnóstico del equipo", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y = drawWrappedText(doc, `${last.intentEmoji} ${last.intentLabel}`, margin, y, pageWidth - margin * 2, 10) + 6;
    y = drawWrappedText(doc, stripMarkdown(last.analysis), margin, y, pageWidth - margin * 2, 10) + 4;
    y = drawWrappedText(doc, `Hueco detectado: ${last.gap}`, margin, y, pageWidth - margin * 2, 10) + 10;
    y = drawWrappedText(
      doc,
      `Núcleo actual: ${last.team.topPlayers.join(", ") || "—"}`,
      margin,
      y,
      pageWidth - margin * 2,
      10,
    ) + 6;
  }

  ensureSpace(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Fichas de jugadores — Candidatos recomendados", margin, y);
  y += 6;

  if (recs.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("No hay candidatos en esta conversación.", margin, y + 14);
    y += 24;
  } else {
    autoTable(doc, {
      startY: y + 4,
      margin: { left: margin, right: margin },
      head: [["#", "Jugador", "Pos.", "Liga", "Edad", "Contrato", "Prioridad", "Mercado"]],
      body: recs.map((r, i) => [
        i + 1,
        r.name,
        r.position,
        r.league,
        `${r.age}`,
        r.contractValue,
        r.priority,
        r.market,
      ]),
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 18, halign: "center" },
        1: { cellWidth: 100 },
        2: { cellWidth: 60 },
        3: { cellWidth: 50 },
        4: { cellWidth: 28, halign: "center" },
        5: { cellWidth: 50 },
        6: { cellWidth: 70 },
        7: { cellWidth: "auto" },
      },
    });
    // @ts-expect-error jspdf-autotable exposes lastAutoTable on the doc
    y = doc.lastAutoTable?.finalY ?? y + 40;
    y += 14;

    for (const [i, r] of recs.entries()) {
      ensureSpace(90);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(2);
      doc.line(margin, y, margin + 30, y);
      doc.setLineWidth(0.4);
      doc.setDrawColor(180, 180, 180);
      doc.rect(margin, y, pageWidth - margin * 2, 0);
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Jugador ${i + 1} — ${r.name}`, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines: string[] = [
        `Posición: ${r.position}    Liga: ${r.league}    Edad: ${r.age} años    Contrato: ${r.contractValue}`,
        `Mercado: ${r.market}    Prioridad: ${r.priority}`,
        `Encaje: ${r.fit}`,
        `Puntos fuertes: ${r.strengths.join(" • ") || "—"}`,
      ];
      for (const line of lines) {
        y = drawWrappedText(doc, line, margin, y, pageWidth - margin * 2, 9) + 4;
      }
      y += 6;
    }
  }

  if (last && last.considerations.length > 0) {
    ensureSpace(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Antes de negociar", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const c of last.considerations) {
      y = drawWrappedText(doc, `• ${c}`, margin, y, pageWidth - margin * 2, 10) + 4;
    }
    y += 6;
  }

  doc.addPage();
  addHeader();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Conversación completa", margin, y);
  y += 6;

  autoTable(doc, {
    startY: y + 4,
    margin: { left: margin, right: margin },
    head: [["#", "Tipo", "Mensaje"]],
    body: messages.length
      ? messages.map((m, i) => [
          i + 1,
          m.type === "user" ? "Usuario" : "Asesor",
          m.data ? buildAdvisorText(m.data) : stripMarkdown(m.content),
        ])
      : [["—", "—", "Sin mensajes en esta conversación."]],
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 22, halign: "center" },
      1: { cellWidth: 60 },
      2: { cellWidth: "auto" },
    },
  });

  doc.save(buildFileName(team.name, "pdf"));
}

function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.setFontSize(fontSize);
  doc.text(lines, x, y);
  return y + lines.length * (fontSize * 1.2);
}

export async function exportToWord(payload: ExportPayload): Promise<void> {
  const { team, messages, generatedAt = new Date() } = payload;
  const recs = collectRecommendations(messages);
  const last = lastAdvisorOutput(messages);

  const children: Array<Paragraph | Table> = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "Informe del Asesor de Fichajes", bold: true, size: 32, color: "1F2937" }),
      ],
    }),
  );

  children.push(
    metaParagraph("Generado:", formatDate(generatedAt)),
    metaParagraph("Equipo:", team.name),
    metaParagraph("Liga:", team.leagueName ?? team.leagueSlug),
    metaParagraph("Mensajes:", String(messages.length)),
    metaParagraph("Recomendaciones:", String(recs.length)),
    spacer(),
  );

  if (last) {
    children.push(
      sectionHeading("Diagnóstico del equipo"),
      bodyParagraph(`${last.intentEmoji} ${last.intentLabel}`),
      bodyParagraph(stripMarkdown(last.analysis)),
      bodyParagraph(`Hueco detectado: ${last.gap}`),
      bodyParagraph(`Núcleo actual: ${last.team.topPlayers.join(", ") || "—"}`),
      spacer(),
    );
  }

  children.push(sectionHeading("Fichas de jugadores — Candidatos recomendados"));

  if (recs.length === 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "No hay candidatos en esta conversación.", italics: true })],
      }),
    );
  } else {
    const headerRow = new TableRow({
      tableHeader: true,
      children: ["#", "Jugador", "Pos.", "Liga", "Edad", "Contrato", "Prioridad", "Mercado"].map(
        (h) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "1F2937", fill: "1F2937" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18 })],
              }),
            ],
          }),
      ),
    });

    const rows: TableRow[] = [headerRow];
    recs.forEach((r, i) => {
      const zebra = i % 2 === 0 ? "FFFFFF" : "F9FAFB";
      const cells = [
        String(i + 1),
        r.name,
        r.position,
        r.league,
        `${r.age}`,
        r.contractValue,
        r.priority,
        r.market,
      ];
      rows.push(
        new TableRow({
          children: cells.map(
            (c) =>
              new TableCell({
                shading: { type: ShadingType.SOLID, color: zebra, fill: zebra },
                children: [new Paragraph({ children: [new TextRun({ text: c, size: 18 })] })],
              }),
          ),
        }),
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      }),
    );

    for (const [i, r] of recs.entries()) {
      children.push(
        spacer(),
        new Paragraph({
          spacing: { before: 120, after: 40 },
          border: {
            top: { color: "F59E0B", space: 4, style: BorderStyle.SINGLE, size: 12 },
          },
          children: [new TextRun({ text: `Jugador ${i + 1} — ${r.name}`, bold: true, size: 24 })],
        }),
        bodyParagraph(`Posición: ${r.position}    Liga: ${r.league}    Edad: ${r.age} años    Contrato: ${r.contractValue}`),
        bodyParagraph(`Mercado: ${r.market}    Prioridad: ${r.priority}`),
        bodyParagraph(`Encaje: ${r.fit}`),
        bodyParagraph(`Puntos fuertes: ${r.strengths.join(" • ") || "—"}`),
      );
    }
  }

  if (last && last.considerations.length > 0) {
    children.push(
      spacer(),
      sectionHeading("Antes de negociar"),
      ...last.considerations.map((c) => bodyParagraph(`• ${c}`)),
    );
  }

  children.push(spacer(), sectionHeading("Conversación completa"));

  if (messages.length === 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Sin mensajes en esta conversación.", italics: true })],
      }),
    );
  } else {
    messages.forEach((m, i) => {
      const cleaned = m.data ? buildAdvisorText(m.data) : stripMarkdown(m.content);
      const isUser = m.type === "user";
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({
              text: `${i + 1}. ${isUser ? "Usuario" : "Asesor"}`,
              bold: true,
              color: isUser ? "B45309" : "1F2937",
            }),
          ],
        }),
        new Paragraph({
          children: [new TextRun({ text: cleaned })],
        }),
      );
    });
  }

  const doc = new Document({
    creator: "Basket Estadísticas",
    title: `Informe Asesor de Fichajes — ${team.name}`,
    description: "Conversación y fichas de jugadores recomendadas",
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, buildFileName(team.name, "docx"));
}

function metaParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label} `, bold: true, size: 20, color: "6B7280" }),
      new TextRun({ text: value, size: 20, color: "111827" }),
    ],
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 20 })],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, color: "1F2937" })],
  });
}

function spacer(): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 80 } });
}
