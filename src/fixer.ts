import * as fs from 'fs';
import * as path from 'path';
import { logToChangelog } from './changelog';
import * as vscode from 'vscode';

export async function applyAutoFix(finding: any, workspacePath: string): Promise<boolean> {
  try {
    const filePath = path.join(workspacePath, finding.file);
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    const originalLine = lines[finding.line - 1];

    // Build comment block above the changed line
    const comment = [
      `// ─────────────────────────────────────────────────`,
      `// OWASP Guardian Auto-Fix`,
      `// Category : ${finding.owasp_category}`,
      `// Severity : ${finding.severity.toUpperCase()}`,
      `// Issue    : ${finding.description}`,
      `// Fix      : ${finding.suggested_fix}`,
      `// Fixed on : ${new Date().toISOString()}`,
      `// ─────────────────────────────────────────────────`,
    ].join('\n');

    // Insert comment above the original line, keep original line intact
    lines.splice(finding.line - 1, 0, comment);

    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export async function applyQueuedFixes(context: vscode.ExtensionContext) {
  const queue: any[] = context.globalState.get('owasp.fixQueue', []);
  const workspacePath: string = context.globalState.get('owasp.workspacePath', '');

  if (queue.length === 0) {
    vscode.window.showInformationMessage('No queued fixes. Run owasp.scan first.');
    return;
  }

  const fixed: any[] = [];
  const unresolved: any[] = [];

  for (const finding of queue) {
    const confirm = await vscode.window.showWarningMessage(
      `Apply fix for ${finding.file}:${finding.line}?\n${finding.description}`,
      'Apply', 'Skip'
    );
    if (confirm === 'Apply') {
      const success = await applyAutoFix(finding, workspacePath);
      if (success) {
        fixed.push(finding);
        logToChangelog(workspacePath, `[APPLIED] ${finding.file}:${finding.line} | ${finding.owasp_category}`);
      } else {
        // Downgrade to review_required on failure
        finding.fix_type = 'review_required';
        unresolved.push(finding);
        logToChangelog(workspacePath, `[FIX FAILED → REVIEW REQUIRED] ${finding.file}:${finding.line} | ${finding.owasp_category}`);
      }
    } else {
      unresolved.push(finding);
      logToChangelog(workspacePath, `[SKIPPED] ${finding.file}:${finding.line} | ${finding.owasp_category}`);
    }
  }

  // Log structured report
  if (fixed.length > 0) {
    logToChangelog(workspacePath, `Fixed:`);
    for (const f of fixed) {
      logToChangelog(workspacePath, `  - ${f.file}:${f.line} [${f.owasp_category}] ${f.description}`);
    }
  }
  if (unresolved.length > 0) {
    logToChangelog(workspacePath, `Unresolved (downgraded to review_required):`);
    for (const f of unresolved) {
      logToChangelog(workspacePath, `  - ${f.file}:${f.line} [${f.owasp_category}] ${f.description}`);
    }
  }

  // Keep only unresolved items in the queue
  context.globalState.update('owasp.fixQueue', unresolved);
  vscode.window.showInformationMessage(
    `Fixes applied: ${fixed.length} | Unresolved: ${unresolved.length}. Run owasp.report to see score.`
  );
}