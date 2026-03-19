// Gemini Video-Zusammenfassung für Tagesschau
// Nutzt die YouTube-URL direkt (kein Download nötig)

import { GoogleGenAI } from "@google/genai";
import type { TagesschauSummary, ThemaSummary } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Analysiert ein Tagesschau-Video via Gemini und erstellt eine strukturierte Zusammenfassung.
 */
export async function summarizeVideo(
  videoUrl: string,
  videoId: string,
  videoTitle: string
): Promise<TagesschauSummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ist nicht gesetzt.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Du bist ein erfahrener Nachrichtenredakteur. Analysiere dieses Tagesschau-Video sorgfältig – sowohl den gesprochenen Inhalt als auch die visuellen Elemente.

Erstelle eine ausführliche, gut lesbare Zusammenfassung auf Deutsch.

Antworte AUSSCHLIESSLICH im folgenden JSON-Format (ohne Markdown-Codeblöcke):
{
  "ueberblick": "2-3 Sätze Gesamtüberblick über die Sendung",
  "themen": [
    {
      "ueberschrift": "Titel des Nachrichtenthemas",
      "zusammenfassung": "Ausführliche Zusammenfassung des Themas in 3-5 Sätzen. Nenne die wichtigsten Fakten, Zahlen, Zitate und Zusammenhänge.",
      "visuelle_beschreibung": "Beschreibe was visuell gezeigt wird: Welche Grafiken, Karten, Personen, Orte, Einblendungen, Archivbilder oder Animationen sind zu sehen? Welche Bilder untermalen die Berichterstattung?"
    }
  ],
  "wetter": "Kurze Wettervorhersage falls in der Sendung enthalten, sonst leerer String"
}

Wichtig:
- Fasse ALLE Themen der Sendung zusammen, nicht nur die ersten
- Die visuelle Beschreibung soll dem Leser ein Bild davon geben, WAS im Video zu sehen war
- Schreibe in einem sachlichen, journalistischen Stil
- Antworte NUR mit dem JSON, kein anderer Text`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        fileData: {
          fileUri: videoUrl,
        },
      },
      {
        text: prompt,
      },
    ],
  });

  const responseText = response.text ?? "";

  // JSON aus der Antwort extrahieren (ggf. umgeben von ```json ... ```)
  const jsonText = extractJson(responseText);
  const parsed = JSON.parse(jsonText);

  // Datum aus dem Titel extrahieren oder heutiges Datum verwenden
  const datum = extractDatumFromTitle(videoTitle);

  const summary: TagesschauSummary = {
    videoId,
    videoUrl,
    titel: videoTitle,
    datum,
    erstelltAm: new Date().toISOString(),
    ueberblick: parsed.ueberblick || "",
    themen: (parsed.themen || []).map((t: ThemaSummary) => ({
      ueberschrift: t.ueberschrift || "",
      zusammenfassung: t.zusammenfassung || "",
      visuelle_beschreibung: t.visuelle_beschreibung || "",
    })),
    wetter: parsed.wetter || "",
  };

  return summary;
}

/**
 * Extrahiert JSON aus einem Text der ggf. in Markdown-Codeblöcken eingebettet ist.
 */
function extractJson(text: string): string {
  // Versuche ```json ... ``` zu finden
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Versuche direkt { ... } zu finden
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  throw new Error("Konnte kein JSON in der Gemini-Antwort finden.");
}

/**
 * Versucht ein Datum aus dem Video-Titel zu extrahieren.
 * Tagesschau-Titel enthalten oft das Datum, z.B. "tagesschau 20:00 Uhr, 19.03.2026"
 */
function extractDatumFromTitle(title: string): string {
  // Versuche DD.MM.YYYY Format
  const dateMatch = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return `${year}-${month}-${day}`;
  }

  // Fallback: heutiges Datum
  return new Date().toISOString().split("T")[0];
}
