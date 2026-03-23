import * as vscode from 'vscode';
import { logToChangelog } from './changelog';

export async function generateReport(context: vscode.ExtensionContext) {
  const original: any[] = context.globalState.get('owasp.lastFindings', []);
  const remaining: any[] = context.globalState.get('owasp.fixQueue', []);
  const workspacePath: string = context.globalState.get('owasp.workspacePath', '');

  const total = original.length;
  const fixed = total - remaining.length;
  const score = total > 0 ? Math.round((fixed / total) * 100) : 100;

  const report = [
    `========== OWASP GUARDIAN REPORT ==========`,
    `Total issues found  : ${total}`,
    `Issues auto-fixed   : ${fixed}`,
    `Issues pending      : ${remaining.length}`,
    `Security score      : ${score}%`,
    `============================================`,
    remaining.length > 0 ? `\nPending issues:` : '',
    ...remaining.map(f => `- ${f.file}:${f.line}  [${f.owasp_category}] ${f.description}`)
  ].join('\n');

  logToChangelog(workspacePath, `\n${report}\n`);

  vscode.window.showInformationMessage(
    `OWASP Report: ${fixed}/${total} fixed (${score}%). See changelog.log for details.`
  );
}