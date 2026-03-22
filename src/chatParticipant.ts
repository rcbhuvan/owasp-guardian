import * as vscode from 'vscode';
import { scanWorkspace } from './scanner';
import { applyQueuedFixes } from './fixer';
import { generateReport } from './reporter';

export function registerChatParticipant(context: vscode.ExtensionContext) {

  const participant = vscode.chat.createChatParticipant(
    'owasp.guardian',
    async (
      request: vscode.ChatRequest,
      chatContext: vscode.ChatContext,
      stream: vscode.ChatResponseStream,
      token: vscode.CancellationToken
    ) => {

      // Route based on slash command
      switch (request.command) {

        case 'scan': {
          stream.markdown('🔍 **Starting OWASP workspace scan...**\n\n');
          await scanWorkspace(context, false); // document-only from chat
          stream.markdown('✅ Scan complete. Check `changelog.log` in your workspace root.\n');
          stream.markdown('Run `@owasp /report` to see your security score.');
          break;
        }

        case 'fix': {
          stream.markdown('🔧 **Applying queued fixes...**\n\n');
          await applyQueuedFixes(context);
          stream.markdown('✅ Done. Run `@owasp /report` to see updated score.');
          break;
        }

        case 'report': {
          const original: any[] = context.globalState.get('owasp.lastFindings', []);
          const remaining: any[] = context.globalState.get('owasp.fixQueue', []);
          const total = original.length;
          const fixed = total - remaining.length;
          const score = total > 0 ? Math.round((fixed / total) * 100) : 100;

          stream.markdown(`## 🛡️ OWASP Security Report\n`);
          stream.markdown(`| Metric | Value |\n|---|---|\n`);
          stream.markdown(`| Total issues found | ${total} |\n`);
          stream.markdown(`| Issues resolved | ${fixed} |\n`);
          stream.markdown(`| Issues remaining | ${remaining.length} |\n`);
          stream.markdown(`| **Security score** | **${score}%** |\n\n`);

          if (remaining.length > 0) {
            stream.markdown(`### Pending Issues\n`);
            for (const f of remaining) {
              stream.markdown(`- \`${f.file}:${f.line}\` — **${f.owasp_category}** — ${f.description}\n`);
            }
          } else {
            stream.markdown(`🎉 All issues resolved!`);
          }
          break;
        }

        case 'explain': {
          // Free-form Q&A about OWASP — pass user's question to Claude
          const userQuestion = request.prompt;
          stream.markdown(`💬 **Asking Claude about: ${userQuestion}**\n\n`);

          const [model] = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'claude-opus-4-5'
          });

          if (!model) {
            stream.markdown('❌ No Copilot model available.');
            break;
          }

          const messages = [
            vscode.LanguageModelChatMessage.User(
              `You are an OWASP security expert. Answer this question clearly with examples:\n\n${userQuestion}`
            )
          ];

          const response = await model.sendRequest(messages, {}, token);
          for await (const chunk of response.text) {
            stream.markdown(chunk);
          }
          break;
        }

        default: {
          // No slash command — treat as free-form security question about the workspace
          const findings: any[] = context.globalState.get('owasp.lastFindings', []);
          const userPrompt = request.prompt;

          const [model] = await vscode.lm.selectChatModels({
  vendor: 'copilot',
  family: 'gpt-4o-mini'
});

          if (!model) {
            stream.markdown('❌ No Copilot model available.');
            break;
          }

          const context_summary = findings.length > 0
            ? `Last scan found ${findings.length} issues:\n` +
              findings.map(f => `- ${f.file}:${f.line} [${f.owasp_category}] ${f.description}`).join('\n')
            : 'No scan has been run yet.';

          const messages = [
            vscode.LanguageModelChatMessage.User(
              `You are an OWASP security expert assistant embedded in VS Code.\n\nCurrent scan context:\n${context_summary}\n\nUser question: ${userPrompt}`
            )
          ];

          const response = await model.sendRequest(messages, {}, token);
          for await (const chunk of response.text) {
            stream.markdown(chunk);
          }
          break;
        }
      }
    }
  );

  participant.iconPath = new vscode.ThemeIcon('shield');
  context.subscriptions.push(participant);
}