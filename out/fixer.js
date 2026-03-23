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
exports.applyAutoFix = applyAutoFix;
exports.applyQueuedFixes = applyQueuedFixes;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const changelog_1 = require("./changelog");
const vscode = __importStar(require("vscode"));
async function applyAutoFix(finding, workspacePath) {
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
    }
    catch {
        return false;
    }
}
async function applyQueuedFixes(context) {
    const queue = context.globalState.get('owasp.fixQueue', []);
    const workspacePath = context.globalState.get('owasp.workspacePath', '');
    if (queue.length === 0) {
        vscode.window.showInformationMessage('No queued fixes. Run owasp.scan first.');
        return;
    }
    const fixed = [];
    const unresolved = [];
    for (const finding of queue) {
        const confirm = await vscode.window.showWarningMessage(`Apply fix for ${finding.file}:${finding.line}?\n${finding.description}`, 'Apply', 'Skip');
        if (confirm === 'Apply') {
            const success = await applyAutoFix(finding, workspacePath);
            if (success) {
                fixed.push(finding);
                (0, changelog_1.logToChangelog)(workspacePath, `[APPLIED] ${finding.file}:${finding.line} | ${finding.owasp_category}`);
            }
            else {
                // Downgrade to review_required on failure
                finding.fix_type = 'review_required';
                unresolved.push(finding);
                (0, changelog_1.logToChangelog)(workspacePath, `[FIX FAILED → REVIEW REQUIRED] ${finding.file}:${finding.line} | ${finding.owasp_category}`);
            }
        }
        else {
            unresolved.push(finding);
            (0, changelog_1.logToChangelog)(workspacePath, `[SKIPPED] ${finding.file}:${finding.line} | ${finding.owasp_category}`);
        }
    }
    // Log structured report
    if (fixed.length > 0) {
        (0, changelog_1.logToChangelog)(workspacePath, `Fixed:`);
        for (const f of fixed) {
            (0, changelog_1.logToChangelog)(workspacePath, `  - ${f.file}:${f.line} [${f.owasp_category}] ${f.description}`);
        }
    }
    if (unresolved.length > 0) {
        (0, changelog_1.logToChangelog)(workspacePath, `Unresolved (downgraded to review_required):`);
        for (const f of unresolved) {
            (0, changelog_1.logToChangelog)(workspacePath, `  - ${f.file}:${f.line} [${f.owasp_category}] ${f.description}`);
        }
    }
    // Keep only unresolved items in the queue
    context.globalState.update('owasp.fixQueue', unresolved);
    vscode.window.showInformationMessage(`Fixes applied: ${fixed.length} | Unresolved: ${unresolved.length}. Run owasp.report to see score.`);
}
//# sourceMappingURL=fixer.js.map