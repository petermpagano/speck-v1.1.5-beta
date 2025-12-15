// Database API for Speck.js Memory System
import { createClient } from "@libsql/client";

let db = null;

export function getDatabase() {
  if (!db) {
    db = createClient({
      url: "file:local.db",
    });
    initTables();
  }
  return db;
}

async function initTables() {
  const database = getDatabase();

  await database.execute(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      agent_id TEXT,
      type TEXT,
      role TEXT,
      content TEXT,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_interactions_session_agent 
    ON interactions(session_id, agent_id)
  `);
}

export async function loadMemory(sessionId, agentId, depth = 5) {
  const database = getDatabase();

  const result = await database.execute({
    sql: `SELECT role, content, type, created_at 
          FROM interactions 
          WHERE session_id = ? AND agent_id = ? 
          ORDER BY created_at DESC 
          LIMIT ?`,
    args: [sessionId, agentId, depth],
  });

  return result.rows.reverse();
}

export async function saveInteraction(
  sessionId,
  agentId,
  role,
  content,
  type = "message"
) {
  const database = getDatabase();

  await database.execute({
    sql: `INSERT INTO interactions (session_id, agent_id, type, role, content)
          VALUES (?, ?, ?, ?, ?)`,
    args: [sessionId, agentId, type, role, content],
  });
}
