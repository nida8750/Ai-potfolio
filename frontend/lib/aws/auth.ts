import "server-only";
import {
  CodeDeliveryFailureException,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { env, isCognitoConfigured } from "@/lib/env";

let client: CognitoIdentityProviderClient | undefined;

function cognito(): CognitoIdentityProviderClient {
  if (!isCognitoConfigured() || !env.awsRegion) {
    throw new Error("Cognito is not configured.");
  }
  if (!client) {
    client = new CognitoIdentityProviderClient({ region: env.awsRegion });
  }
  return client;
}

export async function cognitoSignUp(email: string, password: string, name: string) {
  const result = await cognito().send(
    new SignUpCommand({
      ClientId: env.cognitoClientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
      ],
    }),
  );
  return { userSub: result.UserSub, confirmationRequired: !result.UserConfirmed };
}

export async function cognitoConfirm(email: string, code: string) {
  await cognito().send(
    new ConfirmSignUpCommand({
      ClientId: env.cognitoClientId,
      Username: email,
      ConfirmationCode: code,
    }),
  );
}

export async function cognitoLogin(email: string, password: string) {
  const result = await cognito().send(
    new InitiateAuthCommand({
      ClientId: env.cognitoClientId,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  );
  return result.AuthenticationResult;
}

export async function cognitoForgotPassword(email: string) {
  try {
    await cognito().send(
      new ForgotPasswordCommand({
        ClientId: env.cognitoClientId,
        Username: email,
      }),
    );
  } catch (error) {
    if (error instanceof CodeDeliveryFailureException) {
      throw error;
    }
    throw error;
  }
}

export async function cognitoConfirmForgotPassword(
  email: string,
  code: string,
  password: string,
) {
  await cognito().send(
    new ConfirmForgotPasswordCommand({
      ClientId: env.cognitoClientId,
      Username: email,
      ConfirmationCode: code,
      Password: password,
    }),
  );
}