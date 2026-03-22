import * as vscode from 'vscode';
import { scanWorkspace } from './scanner';
import { applyQueuedFixes } from './fixer';
import { generateReport } from './reporter';
import { registerChatParticipant } from './chatParticipant';

export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(
  vscode.commands.registerCommand('owasp.listModels', async () => {
    const models = await vscode.lm.selectChatModels({});
    if (models.length === 0) {
      console.log('NO MODELS FOUND');
      vscode.window.showErrorMessage('No models found at all.');
    } else {
      models.forEach(m => {
        console.log(`MODEL → vendor: ${m.vendor} | family: ${m.family} | id: ${m.id} | name: ${m.name}`);
      });
      vscode.window.showInformationMessage(`Found ${models.length} model(s). Check Debug Console.`);
    }
  })
);

  context.subscriptions.push(
    vscode.commands.registerCommand('owasp.scan', async () => {
      const autoFix = await vscode.window.showQuickPick(
        ['Yes, auto-apply small fixes', 'No, document everything only'],
        { placeHolder: 'Auto-apply safe small fixes?' }
      );
      const allowAutoFix = autoFix?.startsWith('Yes') ?? false;
      await scanWorkspace(context, allowAutoFix);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('owasp.applyFixes', async () => {
      await applyQueuedFixes(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('owasp.report', async () => {
      await generateReport(context);
    })
  );

  registerChatParticipant(context);
}

export function deactivate() {}