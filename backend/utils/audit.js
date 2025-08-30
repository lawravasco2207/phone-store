// Record compact audit trail for key actions.
import db from '../models/index.js';

export async function writeAudit(userId, action, table, recordId, changes) {
  try {
    await db.AuditLog.create({ user_id: userId || null, action, table_name: table, record_id: recordId || null, changes: changes || null });
  } catch (e) {
    // Never break the request because of audit failures
    console.warn('audit failed:', e.message);
  }
}
