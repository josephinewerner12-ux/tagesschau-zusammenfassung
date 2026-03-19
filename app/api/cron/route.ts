import { NextResponse } from "next/server";
import { getNewestVideo } from "@/lib/youtube";
import { summarizeVideo } from "@/lib/gemini";
import { isSummarized, saveSummary } from "@/lib/storage";
import { sendSummaryEmail } from "@/lib/resend";

/**
 * Cron Job API Route: Wird alle 8 Stunden aufgerufen.
 * Prüft auf neue Tagesschau-Videos, fasst sie zusammen und sendet eine E-Mail.
 */
export async function GET(request: Request) {
  // 1. Sicherheit: CRON_SECRET prüfen (außer lokal)
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    secret !== process.env.CRON_SECRET
  ) {
    return new NextResponse("Nicht autorisiert", { status: 401 });
  }

  try {
    // 2. Neuestes Video von YouTube holen
    const newestVideo = await getNewestVideo();
    if (!newestVideo) {
      return NextResponse.json({ message: "Kein Video gefunden" });
    }

    // 3. Prüfen ob schon verarbeitet
    const alreadySummarized = await isSummarized(newestVideo.videoId);
    if (alreadySummarized) {
      return NextResponse.json({
        message: "Video bereits zusammengefasst",
        videoId: newestVideo.videoId,
      });
    }

    // 4. Zusammenfassung via Gemini erstellen
    console.log(`Starte Zusammenfassung für: ${newestVideo.title}`);
    const summary = await summarizeVideo(
      newestVideo.videoUrl,
      newestVideo.videoId,
      newestVideo.title
    );

    // 5. In Vercel KV speichern
    await saveSummary(summary);

    // 6. E-Mail senden
    const host = request.headers.get("host") || "tagesschau.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const siteUrl = `${protocol}://${host}`;
    
    await sendSummaryEmail(summary, siteUrl);

    return NextResponse.json({
      message: "Erfolgreich zusammengefasst und versendet",
      videoId: newestVideo.videoId,
    });
  } catch (error: any) {
    console.error("Cron Job Fehler:", error);
    return NextResponse.json(
      { error: error.message || "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
