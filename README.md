# **Lambda Vulnerability Scanner**  

A **serverless AWS Lambda function** designed to scan web applications for security vulnerabilities.  

## **Features**  

| Check Name               | Description                                                                 | Severity   | Implementation File |
|--------------------------|-----------------------------------------------------------------------------|------------|---------------------|
| WordPress Detection      | Detects if a website is built with WordPress.                               | `minor`    | [`wordpress.ts`](./src/scans/wordpress.ts) |
| File Traversal           | Identifies potential directory traversal vulnerabilities.                   | `critical` | [`filetraversal.ts`](./src/scans/filetraversal.ts) |
| Software Usage           | Analyzes libraries and technologies used by the website.                    | `info`     | [`usageleak.ts`](./src/scans/usageleak.ts) |
| Outdated Software        | Detects outdated software versions with known vulnerabilities.              | `moderate` | [`outdated/`](./src/scans/outdated) |
| HTTP Upgrade             | Verifies if the site enforces HTTPS by redirecting HTTP traffic.            | `high`     | [`httpupgrade.ts`](./src/scans/httpupgrade.ts) |
| Email Detector           | Scrape for non obfuscated email, showing emails exposed to bots.            | `minor`    | [`emaildetector.ts`](./src/scans/emaildetector.ts) |
| Exposed Configurations   | Fuzzes for commonly exposed config paths.                                   | `high`     | [`exposedConfigs.ts`](./src/scans/exposedConfigs.ts) |
| SSH Configuration        | Scans for open ssh port, ssh version, authentication options, common creds  | `high/critical` | [`ssh.ts`](./src/scans/ssh.ts) |

## **Tech Stack**  

- **Runtime**: Node.js (TypeScript)  
- **Deployment**: [Serverless Framework](https://www.serverless.com/)  
- **Cloud Provider**: AWS Lambda  

## **Installation & Usage**  

```bash
# Clone the repository
git clone https://github.com/your-repo/lambda-vulnerability-scanner.git
cd lambda-vulnerability-scanner

# Install dependencies
npm install

# Local Development
npm run dev

# Deploy
serverless deploy
```

## **Contributing**  
Pull requests are welcome! For major changes, please open an issue first to discuss improvements.  