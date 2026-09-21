# AWS infrastructure

The application code is written against these resources but **none of them are
provisioned or tested yet** — no AWS credentials exist in this environment. Set
the matching variables in `.env.local` (see `.env.example`) to switch each
integration on. Until then the platform runs on a local file datastore and a
local credential store.

## DynamoDB

Set `DATA_STORE=dynamodb`, `AWS_REGION`, and `DYNAMODB_TABLE_NAME`.

Single table, on-demand billing:

| Attribute | Type | Role |
| --- | --- | --- |
| `pk` | String | Partition key |
| `sk` | String | Sort key |
| `gsi1pk` | String | `GSI1` partition key |
| `gsi1sk` | String | `GSI1` sort key |
| `gsi2pk` | String | `GSI2` partition key |
| `gsi2sk` | String | `GSI2` sort key |

Two global secondary indexes, both projecting `ALL`:

- **GSI1** (`gsi1pk`, `gsi1sk`) — list one entity type newest first. Partition
  values are `USER`, `SERVICE`, `PROJECT`, `INQUIRY`, `ORDER`, `PAYMENT`.
- **GSI2** (`gsi2pk`, `gsi2sk`) — list the records owned by one user.
  Partition values look like `USER#<id>#ORDER`.

Key layout:

| Item | `pk` | `sk` |
| --- | --- | --- |
| User profile | `USER#<id>` | `USER` |
| Service | `SERVICE#<id>` | `SERVICE` |
| Project | `PROJECT#<id>` | `PROJECT` |
| Inquiry | `INQUIRY#<id>` | `INQUIRY` |
| Order | `ORDER#<id>` | `ORDER` |
| Payment | `PAYMENT#<id>` | `PAYMENT` |
| Notification | `USER#<userId>` | `NOTIFICATION#<createdAt>#<id>` |
| Audit entry | `AUDIT` | `<createdAt>#<id>` |
| Processed webhook event | `EVENT#<provider>#<eventId>` | `EVENT` |
| Settings | `SETTINGS` | `PLATFORM` |
| Lookup alias | `USER_EMAIL#…`, `SERVICE_SLUG#…`, `PROJECT_SLUG#…`, `ORDER_PROVIDER#…`, `PAYMENT_EVENT#…` | `ALIAS` |

Webhook idempotency relies on a conditional put against
`attribute_not_exists(pk)` for the `EVENT#…` item, so a replayed provider event
is recorded once.

Passwords are never written to DynamoDB. The DynamoDB repository throws if
credential storage is attempted, so `DATA_STORE=dynamodb` expects Cognito.

### Backups

Not enabled yet. Before production, turn on point-in-time recovery on the
table and decide whether AWS Backup is also required. Encryption at rest is
applied by DynamoDB by default.

## Cognito

Set `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` with `AWS_REGION`.

- User pool with email sign-in and a client that permits `USER_PASSWORD_AUTH`.
- Sign-up, confirmation, sign-in, forgot password, and confirm-forgot-password
  are wired in `lib/aws/auth.ts`.
- The pool owns credentials; DynamoDB only stores the application profile and
  the `cognitoSub` link.
- MFA, passkeys, and social providers are not implemented. The provider seam
  exists so they can be added without touching callers.

## S3

Set `S3_BUCKET_NAME` and `AWS_REGION`.

- Keep the bucket private and rely on presigned URLs.
- Uploads are presigned server-side for 60 seconds, restricted to jpeg, png,
  webp, svg, and pdf under 8 MB, with `AES256` server-side encryption.
- Object keys are generated server-side as `<folder>/<userId>/<uuid>.<ext>`;
  the submitted filename is never used.

## IAM

Prefer an execution role over static keys. The runtime role needs only:

- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query` on the
  table and its two indexes.
- `s3:PutObject` and `s3:GetObject` on `arn:aws:s3:::<bucket>/*`.
- `cognito-idp:SignUp`, `ConfirmSignUp`, `InitiateAuth`, `ForgotPassword`, and
  `ConfirmForgotPassword` on the user pool.

Deployment and administration should use separate identities. Do not attach
`AdministratorAccess` to the running application.

## CloudWatch

The application writes single-line JSON to stdout through
`lib/security/logger.ts`, with secret-looking keys redacted. On a Lambda or
Amplify runtime those lines land in CloudWatch Logs without extra wiring. No
metric filters or alarms have been created.
