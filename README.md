# OWASP Guardian

AI-powered OWASP Top 10 vulnerability scanner for VS Code, powered by GitHub Copilot.

## Features

- 🔍 Scans entire workspace for OWASP Top 10 vulnerabilities across all languages
- 🔧 Auto-fixes small, safe issues instantly with detailed comments added above each fix
- 📋 Queues large structural changes for manual review with your approval
- 📝 Logs everything to `changelog.log` in your project root
- 💬 Chat with `@owasp` directly in Copilot Chat panel
- 📊 Security score report showing how many issues are resolved

## Requirements

- GitHub Copilot extension installed and active
- GitHub Copilot Chat extension installed and active
- Signed into GitHub with an active Copilot subscription

## Usage

### Commands (`Ctrl+Shift+P`)

| Command | Description |
|---|---|
| `OWASP: Scan Workspace` | Scan all files for vulnerabilities |
| `OWASP: Apply Queued Fixes` | Apply large queued changes one by one |
| `OWASP: Show Final Report` | See security score and pending issues |

### Copilot Chat (`Ctrl+Alt+I`)

| Command | Description |
|---|---|
| `@owasp /scan` | Trigger a full workspace scan |
| `@owasp /fix` | Apply queued fixes |
| `@owasp /report` | See current security score |
| `@owasp /explain A03:Injection` | Learn about any OWASP category |
| `@owasp is my login.php safe?` | Ask free-form security questions |

## How It Works

1. Run `@owasp /scan` or `OWASP: Scan Workspace`
2. Choose whether to auto-apply small safe fixes
3. Auto-fixed lines get a detailed comment block added above them explaining the fix
4. Review `changelog.log` for full details of all findings
5. Run `OWASP: Apply Queued Fixes` to handle large changes one by one
6. Run `@owasp /report` to see your final security score

## Auto-Fix Comments

When a small fix is auto-applied, OWASP Guardian inserts a comment block above the
affected line so developers can understand what was changed and why:
```php
// ─────────────────────────────────────────────────
// OWASP Guardian Auto-Fix
// Category : A03:Injection
// Severity : HIGH
// Issue    : Unsanitized user input used directly in SQL query
// Fix      : Use prepared statements with parameterized queries
// Fixed on : 2026-03-23T10:45:02.000Z
// ─────────────────────────────────────────────────
$query = "SELECT * FROM users WHERE username='$user'";
```

The original line is always preserved — the comment is inserted above it for full
visibility and traceability.

## Changelog Output

All findings are logged to `changelog.log` in your workspace root:
```
[2026-03-23T10:45:00] [SCAN STARTED]
[2026-03-23T10:45:02] [FOUND] 3 vulnerabilities
[2026-03-23T10:45:02] [HIGH] login.php:4 | A03:Injection → AUTO-FIXED
[2026-03-23T10:45:02] [HIGH] session.php:18 | A07:Auth Failure → QUEUED (large change)
[2026-03-23T10:46:00] [RESCAN] Score: 2/3 issues resolved (67%)
```

## Supported Languages

TypeScript, JavaScript, Python, PHP, Java, C#, Go, Ruby, C/C++, HTML, JSX, TSX and more.

## Troubleshooting

| Problem | Fix |
|---|---|
| `@owasp` doesn't appear in chat | Reload VS Code after install |
| "No Copilot LM model available" | Sign into GitHub Copilot, ensure subscription is active |
| Commands don't appear | Extensions panel → search "owasp" → make sure it's enabled |
| `changelog.log` not created | Open a folder first — VS Code needs an active workspace |

## License

MIT