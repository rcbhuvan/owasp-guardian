import * as vscode from 'vscode';
import { applyAutoFix } from './fixer';
import { logToChangelog } from './changelog';

export async function triageResults(
  findings: any[],
  workspacePath: string,
  allowAutoFix: boolean,
  context: vscode.ExtensionContext
) {
  const queued: any[] = [];

  for (const finding of findings) {
    const tag = `[${finding.severity.toUpperCase()}] ${finding.file}:${finding.line} | ${finding.owasp_category}`;

    if (finding.fix_type === 'auto_fix' && allowAutoFix) {
      const success = await applyAutoFix(finding, workspacePath);
      if (success) {
        logToChangelog(workspacePath, `${tag} → AUTO-FIXED | ${finding.description}`);
      } else {
        // Downgrade to review_required on failure
        finding.fix_type = 'review_required';
        queued.push(finding);
        logToChangelog(workspacePath, `${tag} → AUTO-FIX FAILED → QUEUED (review required) | ${finding.description}`);
      }
    } else {
      // Large change or user said no auto-fix — queue it
      queued.push(finding);
      const reason = finding.fix_type === 'review_required' ? 'QUEUED (large change)' : 'DOCUMENTED (auto-fix disabled)';
      logToChangelog(workspacePath, `${tag} → ${reason} | ${finding.description}`);
      logToChangelog(workspacePath, `  Suggested: ${finding.suggested_fix}`);
    }
  }

  // Persist queue for owasp.applyFixes command
  context.globalState.update('owasp.fixQueue', queued);
}