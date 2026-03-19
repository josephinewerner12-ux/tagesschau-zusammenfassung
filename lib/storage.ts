// Datenspeicherung via Vercel KV (Redis)
import { kv } from "@vercel/kv";
import type { TagesschauSummary } from "./types";

const SUMMARIES_KEY = "tagesschau:summaries"; // Sorted Set
const SUMMARY_PREFIX = "tagesschau:summary:";  // Individual summaries

/**
 * Speichert eine neue Zusammenfassung in Vercel KV.
 */
export async function saveSummary(summary: TagesschauSummary): Promise<void> {
  // Einzelne Zusammenfassung speichern
  await kv.set(`${SUMMARY_PREFIX}${summary.videoId}`, JSON.stringify(summary));

  // Video-ID zum sortierten Set hinzufügen (Score = Timestamp für Sortierung)
  const timestamp = new Date(summary.erstelltAm).getTime();
  await kv.zadd(SUMMARIES_KEY, { score: timestamp, member: summary.videoId });
}

/**
 * Prüft ob ein Video bereits zusammengefasst wurde.
 */
export async function isSummarized(videoId: string): Promise<boolean> {
  const exists = await kv.exists(`${SUMMARY_PREFIX}${videoId}`);
  return exists === 1;
}

/**
 * Holt eine einzelne Zusammenfassung.
 */
export async function getSummary(
  videoId: string
): Promise<TagesschauSummary | null> {
  const data = await kv.get<string>(`${SUMMARY_PREFIX}${videoId}`);
  if (!data) return null;

  if (typeof data === "string") {
    return JSON.parse(data) as TagesschauSummary;
  }
  return data as TagesschauSummary;
}

/**
 * Holt alle Zusammenfassungen, sortiert nach Datum (neueste zuerst).
 */
export async function getAllSummaries(
  limit: number = 50
): Promise<TagesschauSummary[]> {
  // Video-IDs aus dem Sorted Set holen (neueste zuerst)
  const videoIds = await kv.zrange<string[]>(SUMMARIES_KEY, 0, limit - 1, {
    rev: true,
  });

  if (!videoIds || videoIds.length === 0) {
    return [];
  }

  // Alle Zusammenfassungen parallel laden
  const summaries = await Promise.all(
    videoIds.map((id) => getSummary(id))
  );

  return summaries.filter((s): s is TagesschauSummary => s !== null);
}
