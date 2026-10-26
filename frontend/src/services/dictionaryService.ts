// SQLite WASM dictionary search service

declare global {
  interface Window {
    initSqlJs?: (config: { locateFile: (file: string) => string }) => Promise<any>;
  }
}

class DictionaryService {
  private db: any = null;
  private isLoaded = false;
  private loadPromise: Promise<boolean> | null = null;

  public async init(): Promise<boolean> {
    if (this.isLoaded) return true;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        if (!window.initSqlJs) {
          console.warn('initSqlJs not found on window');
          return false;
        }

        const SQL = await window.initSqlJs({
          locateFile: (file: string) => `/${file}`,
        });

        const response = await fetch('/dictionary.sqlite');
        const buffer = await response.arrayBuffer();

        this.db = new SQL.Database(new Uint8Array(buffer));
        this.isLoaded = true;
        console.log('Dictionary SQLite database successfully loaded into WebAssembly memory');
        return true;
      } catch (err) {
        console.warn('Failed to load dictionary sqlite database:', err);
        return false;
      }
    })();

    return this.loadPromise;
  }

  public getPredictions(prefix: string, limit = 8): string[] {
    if (!this.db || !this.isLoaded || !prefix.trim()) return [];

    try {
      const sanitized = prefix.replace(/['\\]/g, '');
      const query = `SELECT entry FROM words WHERE entry LIKE '${sanitized}%' ESCAPE '\\' LIMIT ${limit}`;
      const stmt = this.db.prepare(query);
      const results: string[] = [];

      while (stmt.step()) {
        const row = stmt.getAsObject();
        if (row.entry) {
          results.push(String(row.entry));
        }
      }
      stmt.free();
      return results;
    } catch (e) {
      console.error('Error querying SQLite dictionary:', e);
      return [];
    }
  }
}

export const dictionaryService = new DictionaryService();

