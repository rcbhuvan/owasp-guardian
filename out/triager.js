"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triageResults = triageResults;
const fixer_1 = require("./fixer");
const changelog_1 = require("./changelog");
async function triageResults(findings, workspacePath, allowAutoFix, context) {
    const queued = [];
    for (const finding of findings) {
        const tag = `[${finding.severity.toUpperCase()}] ${finding.file}:${finding.line} | ${finding.owasp_category}`;
        if (finding.fix_type === 'auto_fix' && allowAutoFix) {
            const success = await (0, fixer_1.applyAutoFix)(finding, workspacePath);
            if (success) {
                (0, changelog_1.logToChangelog)(workspacePath, `${tag} → AUTO-FIXED | ${finding.description}`);
            }
            else {
                // Downgrade to review_required on failure
                finding.fix_type = 'review_required';
                queued.push(finding);
                (0, changelog_1.logToChangelog)(workspacePath, `${tag} → AUTO-FIX FAILED → QUEUED (review required) | ${finding.description}`);
            }
        }
        else {
            // Large change or user said no auto-fix — queue it
            queued.push(finding);
            const reason = finding.fix_type === 'review_required' ? 'QUEUED (large change)' : 'DOCUMENTED (auto-fix disabled)';
            (0, changelog_1.logToChangelog)(workspacePath, `${tag} → ${reason} | ${finding.description}`);
            (0, changelog_1.logToChangelog)(workspacePath, `  Suggested: ${finding.suggested_fix}`);
        }
    }
    // Persist queue for owasp.applyFixes command
    context.globalState.update('owasp.fixQueue', queued);
}
//# sourceMappingURL=triager.js.map