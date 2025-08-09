# Lambda Vulnrability Scanner

A serverless webapp vulnrability scanner function.

## Current Security Checks

| Name               | Description                                      | Severity   |
|--------------------|--------------------------------------------------|------------|
| [WordPress Detection](./src/scans/wordpress.ts) | Detects whether a website is using WordPress.    | `minor`    |
| [File Traversal](./src/scans/filetraversal.ts)      | Checks for potential directory traversal vulnerabilities. | `critical` |
| [Software Usage](./src/scans/usageleak.ts)      | Identifies libraries and technologies used by the website. | `info`     |
| [Outdated Software](./src/scans/outdated/index.ts)  | Detects outdated software with known vulnerabilities. | `moderate` |
| [HTTP Upgrade](./src/scans/httpupgrade.ts)       | Checks if the site redirects HTTP to HTTPS.      | `high`      

## Stack

- NodeJs (TypeScript)
- [Serverless](https://www.serverless.com/)
- AWS Lambda