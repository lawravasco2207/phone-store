// Record compact audit trail for key actions.
import db from '../models/index.js';

export async function writeAudit(userId, action, table, recordId, changes) {
  try {
    // Check if AuditLog model exists and table is accessible before trying to write
    if (db.AuditLog) {
      try {
        await db.AuditLog.create({ 
          user_id: userId || null, 
          action, 
          table_name: table, 
          record_id: recordId || null, 
          changes: changes || null 
        });
      } catch (createError) {
        // Handle specific database errors
        if (createError.name === 'SequelizeDatabaseError' && 
            createError.message.includes('relation "AuditLogs" does not exist')) {
          console.warn('AuditLogs table does not exist. Run migrations to create it.');
          console.log(`Audit fallback: ${action} on ${table}:${recordId} by user ${userId}`);
        } else {
          // For other database errors, just log to console
          console.warn('Failed to write to audit log:', createError.message);
          console.log(`Audit fallback: ${action} on ${table}:${recordId} by user ${userId}`);
        }
      }
    } else {
      // AuditLog table not available, just log to console
      console.log(`Audit (no table): ${action} on ${table}:${recordId} by user ${userId}`);
    }
  } catch (e) {
    // Never break the request because of audit failures
    console.warn('audit failed:', e.message);
    
    // Log audit data to console as fallback
    console.log(`Audit fallback: ${action} on ${table}:${recordId} by user ${userId}`);
  }
}
