import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { triageResults } from './triager';
import { logToChangelog } from './changelog';

const SUPPORTED_EXTENSIONS = [
  '.ts', '.js', '.py', '.php', '.java', '.cs', '.go',
  '.rb', '.cpp', '.c', '.html', '.jsx', '.tsx'
];

export async function scanWorkspace(
  context: vscode.ExtensionContext,
  allowAutoFix: boolean
) {
  const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspacePath) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }

  vscode.window.showInformationMessage('OWASP Guardian: Scanning workspace...');

  // Collect all supported files
  const files = collectFiles(workspacePath);
  if (files.length === 0) {
    vscode.window.showWarningMessage('No supported source files found.');
    return;
  }

  // Build code context string
  const codeContext = files.map(f => {
    const relative = path.relative(workspacePath, f);
    const content = fs.readFileSync(f, 'utf-8');
    return `--- FILE: ${relative} ---\n${content}`;
  }).join('\n\n');

  // Read system prompt
  const promptPath = path.join(context.extensionPath, 'prompts', 'owasp-scan.md');
  const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

  // Call VS Code LM API
  const [model] = await vscode.lm.selectChatModels({
  vendor: 'copilot',
  family: 'gpt-4o-mini'
});

  if (!model) {
    vscode.window.showErrorMessage('No Copilot LM model available. Check your Copilot login.');
    return;
  }

  const messages = [
    vscode.LanguageModelChatMessage.User(
      `${systemPrompt}\n\nHere is the codebase to scan:\n\n${codeContext}`
    )
  ];

  let rawResponse = '';
  const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
  for await (const chunk of response.text) {
    rawResponse += chunk;
  }

  // Parse results
  let findings = [];
  try {
    findings = JSON.parse(rawResponse);
  } catch {
    vscode.window.showErrorMessage('Failed to parse scan results. Check changelog.log for raw output.');
    logToChangelog(workspacePath, `[RAW RESPONSE]\n${rawResponse}`);
    return;
  }

  logToChangelog(workspacePath, `[SCAN STARTED] ${new Date().toISOString()}`);
  logToChangelog(workspacePath, `[FOUND] ${findings.length} vulnerabilities`);

  // Store findings in global state for report command
  context.globalState.update('owasp.lastFindings', findings);
  context.globalState.update('owasp.workspacePath', workspacePath);

  await triageResults(findings, workspacePath, allowAutoFix, context);

  vscode.window.showInformationMessage(
    `OWASP Scan complete. ${findings.length} issues found. Check changelog.log`
  );
}

function collectFiles(dir: string, results: string[] = []): string[] {
  const skip = ['node_modules', '.git', 'dist', 'build', 'out'];
  for (const entry of fs.readdirSync(dir)) {
    if (skip.includes(entry)) continue;
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, results);
    } else if (SUPPORTED_EXTENSIONS.includes(path.extname(entry))) {
      results.push(full);
    }
  }
  return results;
}