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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const scanner_1 = require("./scanner");
const fixer_1 = require("./fixer");
const reporter_1 = require("./reporter");
const chatParticipant_1 = require("./chatParticipant");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('owasp.listModels', async () => {
        const models = await vscode.lm.selectChatModels({});
        if (models.length === 0) {
            console.log('NO MODELS FOUND');
            vscode.window.showErrorMessage('No models found at all.');
        }
        else {
            models.forEach(m => {
                console.log(`MODEL → vendor: ${m.vendor} | family: ${m.family} | id: ${m.id} | name: ${m.name}`);
            });
            vscode.window.showInformationMessage(`Found ${models.length} model(s). Check Debug Console.`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('owasp.scan', async () => {
        const autoFix = await vscode.window.showQuickPick(['Yes, auto-apply small fixes', 'No, document everything only'], { placeHolder: 'Auto-apply safe small fixes?' });
        const allowAutoFix = autoFix?.startsWith('Yes') ?? false;
        await (0, scanner_1.scanWorkspace)(context, allowAutoFix);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('owasp.applyFixes', async () => {
        await (0, fixer_1.applyQueuedFixes)(context);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('owasp.report', async () => {
        await (0, reporter_1.generateReport)(context);
    }));
    (0, chatParticipant_1.registerChatParticipant)(context);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map