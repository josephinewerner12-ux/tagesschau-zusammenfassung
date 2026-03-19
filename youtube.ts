// YouTube RSS Feed Abfrage für Tagesschau 20 Uhr Playlist
// Playlist: https://www.youtube.com/playlist?list=PL4A2F331EE86DCC22
// RSS: https://www.youtube.com/feeds/videos.xml?playlist_id=PL4A2F331EE86DCC22

const PLAYLIST_ID = "PL4A2F331EE86DCC22";
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;

export interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  videoUrl: string;
}

/**
 * Ruft die neuesten Videos der Tagesschau-Playlist via RSS ab.
 * Kein API-Key nötig – RSS ist öffentlich.
 */
export async function getLatestVideos(limit: number = 5): Promise<YouTubeVideo[]> {
  const response = await fetch(RSS_URL, {
    next: { revalidate: 0 }, // Kein Cache
  });

  if (!response.ok) {
    throw new Error(`YouTube RSS Fehler: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parseRssFeed(xml, limit);
}

/**
 * Extrahiert die neueste Video-URL aus dem RSS-Feed.
 */
export async function getNewestVideo(): Promise<YouTubeVideo | null> {
  const videos = await getLatestVideos(1);
  return videos.length > 0 ? videos[0] : null;
}

/**
 * Einfacher XML-Parser für YouTube RSS (Atom) Feed.
 * Wir vermeiden extra Dependencies und parsen das XML manuell.
 */
function parseRssFeed(xml: string, limit: number): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];

  // Alle <entry>-Blöcke finden
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  let count = 0;

  while ((match = entryRegex.exec(xml)) !== null && count < limit) {
    const entry = match[1];

    // Video-ID extrahieren
    const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    // Titel extrahieren
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    // Veröffentlichungsdatum
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);

    if (videoIdMatch && titleMatch && publishedMatch) {
      const videoId = videoIdMatch[1];
      videos.push({
        videoId,
        title: decodeXmlEntities(titleMatch[1]),
        publishedAt: publishedMatch[1],
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
      count++;
    }
  }

  return videos;
}

/**
 * Dekodiert XML-Entitäten in Text.
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
