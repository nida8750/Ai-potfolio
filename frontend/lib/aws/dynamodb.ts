import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env, isDynamoConfigured } from "@/lib/env";

let client: DynamoDBDocumentClient | undefined;

export function dynamoClient(): DynamoDBDocumentClient {
  if (!isDynamoConfigured()) {
    throw new Error("DynamoDB is not configured.");
  }
  if (!client) {
    client = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: env.awsRegion }),
      { marshallOptions: { removeUndefinedValues: true } },
    );
  }
  return client;
}

export function dynamoTableName(): string {
  if (!env.dynamoTableName) {
    throw new Error("DYNAMODB_TABLE_NAME is not set.");
  }
  return env.dynamoTableName;
}
