export interface SyncedLyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsResult {
  syncedLyrics: SyncedLyricLine[];
  plainLyrics: string;
  found: boolean;
}

function parseLRC(lrc: string): SyncedLyricLine[] {
  const lines = lrc.split('\n');
  const result: SyncedLyricLine[] = [];
  
  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const ms = parseInt(match[3].padEnd(3, '0'));
      const time = minutes * 60 + seconds + ms / 1000;
      const text = match[4].trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }
  
  return result.sort((a, b) => a.time - b.time);
}

export async function searchLyrics(artist: string, title: string): Promise<LyricsResult> {
  try {
    const response = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    );
    
    if (!response.ok) {
      // Try search endpoint
      const searchResponse = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`
      );
      
      if (!searchResponse.ok) {
        return { syncedLyrics: [], plainLyrics: '', found: false };
      }
      
      const results = await searchResponse.json();
      if (results.length > 0 && results[0].syncedLyrics) {
        return {
          syncedLyrics: parseLRC(results[0].syncedLyrics),
          plainLyrics: results[0].plainLyrics || '',
          found: true,
        };
      }
      
      return { syncedLyrics: [], plainLyrics: results[0]?.plainLyrics || '', found: results.length > 0 };
    }
    
    const data = await response.json();
    return {
      syncedLyrics: data.syncedLyrics ? parseLRC(data.syncedLyrics) : [],
      plainLyrics: data.plainLyrics || '',
      found: true,
    };
  } catch {
    return { syncedLyrics: [], plainLyrics: '', found: false };
  }
}
