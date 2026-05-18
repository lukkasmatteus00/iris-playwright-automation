import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(currentFilePath), "../../..");

dotenv.config({ path: resolve(projectRoot, ".env") });

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().optional()
);

const requiredTrimmedString = (name: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(1, `Missing required environment variable: ${name}`)
  );

const envSchema = z.object({
  FRONTEND_BASE_URL: requiredTrimmedString("FRONTEND_BASE_URL"),
  BACKEND_BASE_URL: requiredTrimmedString("BACKEND_BASE_URL"),
  X_CASE_TOKEN: requiredTrimmedString("X_CASE_TOKEN"),
  TEST_SUBJECT_PASSWORD: requiredTrimmedString("TEST_SUBJECT_PASSWORD"),
  JUNIOR_COORDINATOR_PASSWORD: optionalTrimmedString,
  SENIOR_COORDINATOR_PASSWORD: requiredTrimmedString("SENIOR_COORDINATOR_PASSWORD"),
  TEST_SUBJECT_ROLE: requiredTrimmedString("TEST_SUBJECT_ROLE"),
  JUNIOR_COORDINATOR_ROLE: optionalTrimmedString,
  SENIOR_COORDINATOR_ROLE: requiredTrimmedString("SENIOR_COORDINATOR_ROLE")
});

const env = envSchema.parse(process.env);

export type TestEnv = {
  frontendBaseUrl: string;
  backendBaseUrl: string;
  xCaseToken: string;
  testSubjectPassword: string;
  juniorCoordinatorPassword?: string;
  seniorCoordinatorPassword: string;
  testSubjectRole: string;
  juniorCoordinatorRole?: string;
  seniorCoordinatorRole: string;
};

export type AuthEnv = {
  backendBaseUrl: string;
  xCaseToken: string;
};

export function testEnv(): TestEnv {
  return {
    frontendBaseUrl: env.FRONTEND_BASE_URL,
    backendBaseUrl: env.BACKEND_BASE_URL.replace(/\/+$/, ""),
    xCaseToken: env.X_CASE_TOKEN,
    testSubjectPassword: env.TEST_SUBJECT_PASSWORD,
    juniorCoordinatorPassword: env.JUNIOR_COORDINATOR_PASSWORD,
    seniorCoordinatorPassword: env.SENIOR_COORDINATOR_PASSWORD,
    testSubjectRole: env.TEST_SUBJECT_ROLE,
    juniorCoordinatorRole: env.JUNIOR_COORDINATOR_ROLE,
    seniorCoordinatorRole: env.SENIOR_COORDINATOR_ROLE
  };
}

export function apiEnv(): AuthEnv {
  const { backendBaseUrl, xCaseToken } = testEnv();
  return { backendBaseUrl, xCaseToken };
}

export function frontendBaseUrl(): string {
  return testEnv().frontendBaseUrl;
}

export function maskSecret(value: string): string {
  if (value.length <= 8) {
    return "[masked]";
  }

  return `${value.slice(0, 4)}...[masked]...${value.slice(-4)}`;
}

export function sanitizeApiError(error: unknown, envToMask: AuthEnv): Error {
  const message = error instanceof Error ? error.message : String(error);
  const sanitizedMessage = message.replaceAll(envToMask.xCaseToken, maskSecret(envToMask.xCaseToken));
  return new Error(sanitizedMessage);
}
