import { getAllSummaries } from "@/lib/storage";
import type { TagesschauSummary } from "@/lib/types";

export const revalidate = 3600; // Cache für 1 Stunde

export default async function Home() {
  const summaries = await getAllSummaries(10);

  return (
    <main>
      <header className="animate-fade-in">
        <h1>Tagesschau KI</h1>
        <p className="subtitle">Visuelle Zusammenfassungen der 20-Uhr-Sendung</p>
      </header>

      {summaries.length === 0 ? (
        <div className="summary-card animate-fade-in" style={{ textAlign: "center" }}>
          <p>Noch keine Zusammenfassungen verfügbar. Der erste Bericht erscheint nach dem nächsten Cron-Lauf.</p>
        </div>
      ) : (
        <div className="summary-list">
          {summaries.map((s, idx) => (
            <SummaryCard key={s.videoId} summary={s} isLatest={idx === 0} />
          ))}
        </div>
      )}

      <footer style={{ textAlign: "center", marginTop: "80px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        <p>© {new Date().getFullYear()} Tagesschau Zusammenfassung • Erstellt mit Gemini AI</p>
      </footer>
    </main>
  );
}

function SummaryCard({ summary, isLatest }: { summary: TagesschauSummary; isLatest: boolean }) {
  const formattedDate = new Date(summary.datum + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`summary-card animate-fade-in`} style={{ animationDelay: isLatest ? "0s" : "0.1s" }}>
      <header style={{ textAlign: "left", marginBottom: "32px" }}>
        <span className="date-badge">{formattedDate}</span>
        <h2 style={{ fontSize: "1.8rem", color: "#fff" }}>{summary.titel}</h2>
      </header>

      <div className="overview-box">
        {summary.ueberblick}
      </div>

      <div className="themes">
        {summary.themen.map((t, i) => (
          <div key={i} className="topic">
            <h3>{t.ueberschrift}</h3>
            <p>{t.zusammenfassung}</p>
            <div className="visual-desc">
              {t.visuelle_beschreibung}
            </div>
          </div>
        ))}
      </div>

      {summary.wetter && (
        <div className="wetter-box">
          <h4>🌤️ Wettervorhersage</h4>
          <p>{summary.wetter}</p>
        </div>
      )}

      <div style={{ marginTop: "40px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <a href={summary.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ background: "#dc2626" }}>
          ▶ Video auf YouTube ansehen
        </a>
      </div>
    </div>
  );
}
