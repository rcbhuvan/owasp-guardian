"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatParticipant = registerChatParticipant;
const vscode = __importStar(require("vscode"));
const scanner_1 = require("./scanner");
const fixer_1 = require("./fixer");
function registerChatParticipant(context) {
    const participant = vscode.chat.createChatParticipant('owasp.guardian', async (request, chatContext, stream, token) => {
        // Route based on slash command
        switch (request.command) {
            case 'scan': {
                stream.markdown('🔍 **Starting OWASP workspace scan...**\n\n');
                await (0, scanner_1.scanWorkspace)(context, false); // document-only from chat
                stream.markdown('✅ Scan complete. Check `changelog.log` in your workspace root.\n');
                stream.markdown('Run `@owasp /report` to see your security score.');
                break;
            }
            case 'fix': {
                stream.markdown('🔧 **Applying queued fixes...**\n\n');
                await (0, fixer_1.applyQueuedFixes)(context);
                stream.markdown('✅ Done. Run `@owasp /report` to see updated score.');
                break;
            }
            case 'report': {
                const original = context.globalState.get('owasp.lastFindings', []);
                const remaining = context.globalState.get('owasp.fixQueue', []);
                const total = original.length;
                const fixed = total - remaining.length;
                const score = total > 0 ? Math.round((fixed / total) * 100) : 100;
                stream.markdown(`## 🛡️ OWASP Security Report\n`);
                stream.markdown(`| Metric | Value |\n|---|---|\n`);
                stream.markdown(`| Total issues found | ${total} |\n`);
                stream.markdown(`| Issues auto-fixed | ${fixed} |\n`);
                stream.markdown(`| Issues pending | ${remaining.length} |\n`);
                stream.markdown(`| **Security score** | **${score}%** |\n\n`);
                if (remaining.length > 0) {
                    stream.markdown(`### Pending Issues\n`);
                    for (const f of remaining) {
                        stream.markdown(`- \`${f.file}:${f.line}\` — **${f.owasp_category}** — ${f.description}\n`);
                    }
                }
                else {
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
                    vscode.LanguageModelChatMessage.User(`You are an OWASP security expert. Answer this question clearly with examples:\n\n${userQuestion}`)
                ];
                const response = await model.sendRequest(messages, {}, token);
                for await (const chunk of response.text) {
                    stream.markdown(chunk);
                }
                break;
            }
            default: {
                // No slash command — treat as free-form security question about the workspace
                const findings = context.globalState.get('owasp.lastFindings', []);
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
                    vscode.LanguageModelChatMessage.User(`You are an OWASP security expert assistant embedded in VS Code.\n\nCurrent scan context:\n${context_summary}\n\nUser question: ${userPrompt}`)
                ];
                const response = await model.sendRequest(messages, {}, token);
                for await (const chunk of response.text) {
                    stream.markdown(chunk);
                }
                break;
            }
        }
    });
    participant.iconPath = new vscode.ThemeIcon('shield');
    context.subscriptions.push(participant);
}
//# sourceMappingURL=chatParticipant.js.map