import { getDatabase } from '../database/connection.js';
import { GenerationRecord, GenerationType, GenerationStatus } from '../types/generation.types.js';
import { v4 as uuidv4 } from 'uuid';

export interface HistoryItem {
  id: string;
  type: GenerationType;
  prompt: string;
  sourceFileUrl?: string;
  mediaUrl: string;
  mediaType: string;
  status: GenerationStatus;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface SaveGenerationInput {
  type: GenerationType;
  prompt: string;
  sourceFilePath?: string;
  mediaFilePath: string;
  mediaType: string;
  status: GenerationStatus;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export class HistoryService {
  private db = getDatabase();

  /**
   * Save a generation to history
   */
  async saveGeneration(input: SaveGenerationInput): Promise<string> {
    const id = uuidv4();

    const stmt = this.db.prepare(`
      INSERT INTO generations (
        id, type, prompt, source_file_path, media_file_path,
        media_type, status, error_message, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.type,
      input.prompt,
      input.sourceFilePath || null,
      input.mediaFilePath,
      input.mediaType,
      input.status,
      input.errorMessage || null,
      input.metadata ? JSON.stringify(input.metadata) : null
    );

    return id;
  }

  /**
   * Get generation history with pagination
   */
  async getHistory(
    userId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<HistoryItem[]> {
    // Note: userId parameter is for future multi-user support
    const stmt = this.db.prepare(`
      SELECT * FROM generations
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(limit, offset) as any[];

    return rows.map((row) => this.mapRowToHistoryItem(row));
  }

  /**
   * Get a generation by ID
   */
  async getById(id: string): Promise<HistoryItem | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM generations WHERE id = ?
    `);

    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToHistoryItem(row);
  }

  /**
   * Delete a generation by ID
   */
  async deleteById(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      DELETE FROM generations WHERE id = ?
    `);

    const result = stmt.run(id);

    return result.changes > 0;
  }

  /**
   * Get total count of generations
   */
  async getCount(): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM generations
    `);

    const result = stmt.get() as any;
    return result.count;
  }

  /**
   * Get generations by type
   */
  async getByType(type: GenerationType, limit: number = 50): Promise<HistoryItem[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM generations
      WHERE type = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(type, limit) as any[];

    return rows.map((row) => this.mapRowToHistoryItem(row));
  }

  /**
   * Get generations by status
   */
  async getByStatus(status: GenerationStatus, limit: number = 50): Promise<HistoryItem[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM generations
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(status, limit) as any[];

    return rows.map((row) => this.mapRowToHistoryItem(row));
  }

  /**
   * Update generation status
   */
  async updateStatus(
    id: string,
    status: GenerationStatus,
    errorMessage?: string
  ): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE generations
      SET status = ?, error_message = ?
      WHERE id = ?
    `);

    const result = stmt.run(status, errorMessage || null, id);

    return result.changes > 0;
  }

  /**
   * Delete old generations
   */
  async deleteOlderThan(daysOld: number): Promise<number> {
    const stmt = this.db.prepare(`
      DELETE FROM generations
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(daysOld);

    return result.changes;
  }

  /**
   * Map database row to HistoryItem
   */
  private mapRowToHistoryItem(row: any): HistoryItem {
    return {
      id: row.id,
      type: row.type as GenerationType,
      prompt: row.prompt,
      sourceFileUrl: row.source_file_path
        ? `/api/media/${row.source_file_path.split('/').pop()}`
        : undefined,
      mediaUrl: `/api/media/${row.media_file_path.split('/').pop()}`,
      mediaType: row.media_type,
      status: row.status as GenerationStatus,
      createdAt: new Date(row.created_at),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}

// Singleton instance
let historyServiceInstance: HistoryService | null = null;

export function getHistoryService(): HistoryService {
  if (!historyServiceInstance) {
    historyServiceInstance = new HistoryService();
  }
  return historyServiceInstance;
}
