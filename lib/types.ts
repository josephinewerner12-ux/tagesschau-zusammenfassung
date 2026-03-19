// TypeScript Typen für Tagesschau-Zusammenfassungen

export interface ThemaSummary {
  ueberschrift: string;
  zusammenfassung: string;
  visuelle_beschreibung: string;
}

export interface TagesschauSummary {
  videoId: string;
  videoUrl: string;
  titel: string;
  datum: string;       // ISO date string, z.B. "2026-03-19"
  erstelltAm: string;  // ISO datetime string
  ueberblick: string;
  themen: ThemaSummary[];
  wetter: string;
}

export interface SummaryListResponse {
  summaries: TagesschauSummary[];
  total: number;
}
