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
exports.generateReport = generateReport;
const vscode = __importStar(require("vscode"));
const changelog_1 = require("./changelog");
async function generateReport(context) {
    const original = context.globalState.get('owasp.lastFindings', []);
    const remaining = context.globalState.get('owasp.fixQueue', []);
    const workspacePath = context.globalState.get('owasp.workspacePath', '');
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
    (0, changelog_1.logToChangelog)(workspacePath, `\n${report}\n`);
    vscode.window.showInformationMessage(`OWASP Report: ${fixed}/${total} fixed (${score}%). See changelog.log for details.`);
}
//# sourceMappingURL=reporter.js.map