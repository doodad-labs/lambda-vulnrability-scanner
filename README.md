# Lambda Vulnerability Scanner

Simple AWS Lambda (Node.js 22.x / TypeScript) that accepts a JSON body containing a `url` and `email`, performs an HTTP GET to the provided URL, and returns metadata about the response (status, headers subset, latency, and a snippet of the body). Deployed automatically via GitHub Actions + AWS SAM when pushing to `main`.

## Invocation (Fire-and-Forget)

The function is designed for asynchronous invocation. It performs the fetch and logs structured JSON to CloudWatch, returning no payload.

Sample event JSON:

```json
{ "url": "https://example.com", "email": "user@example.com" }
```

Invoke asynchronously with AWS CLI (region eu-north-1):

```bash
aws lambda invoke \
   --region eu-north-1 \
   --function-name url-fetch-function \
   --invocation-type Event \
   --payload '{"url":"https://example.com","email":"user@example.com"}' \
   /dev/null
```

Logs (CloudWatch) will contain a JSON line like:

```json
{"level":"info","message":"FetchComplete","email":"user@example.com","url":"https://example.com/","status":200,"ok":true,"durationMs":120,"totalHandlerMs":125,"bodySnippet":"<!doctype html>...","truncated":false}
```

Failures log a `FetchFailed` entry and the Lambda will report an error (allowing retries / DLQ if configured).

## Development

Install dependencies & build:

```bash
npm ci
npm run build
```

Package & deploy (requires configured AWS credentials):

```bash
npm run deploy
```

## GitHub Actions Deployment

Configure one of the following in repository secrets:

1. OIDC Role (recommended):
   - `AWS_ROLE_TO_ASSUME`: ARN of IAM role with trust policy for GitHub OIDC and permissions for CloudFormation, Lambda, IAM, and API Gateway.
   - `AWS_REGION`: (optional) overrides default deploy region `eu-north-1`.

2. Access Keys (fallback):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (optional)

On push to `main`, the workflow builds TypeScript, runs `sam build`, then deploys the stack `LambdaVulnerabilityScannerStack` to region `eu-north-1`.

## Security Notes

- Only `http`/`https` URLs allowed; response body truncated to 500 chars.
- No persistence; if you need to email results, integrate with SES/SNS next.
- Consider adding explicit allow/block lists to mitigate SSRF risk in production.

## Next Enhancements (Ideas)

- Add allowlist / blocklist for domains.
- Integrate with Amazon SES to email results to the provided address.
- Add unit tests (Jest) and linting (ESLint) pipeline.
- Add structured logging (e.g., pino) and CloudWatch log retention configuration.

## License

MIT
