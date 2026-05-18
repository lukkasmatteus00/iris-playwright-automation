import type { APIRequestContext, APIResponse } from "@playwright/test";
import { expect } from "@playwright/test";

import { getRoleSessionCookie, type CookieHeader } from "@support/api/auth/auth.client.js";
import {
  createSession,
  getFirstActiveSubjectId,
  getFirstApparatusId,
  getFirstChamberId
} from "@support/api/session/session.client.js";
import { testEnv, type AuthEnv } from "@support/config/env.js";

export type SessionPayload = {
  id: string;
  subject_id: string;
  chamber_id: string;
  apparatus_id: string;
  scheduled_for: string;
};

export type SessionSetup = {
  cookie: CookieHeader;
  payload: SessionPayload;
};

export type CreatedSessionSetup = SessionSetup & {
  sessionId: string;
  response: APIResponse;
};

export function generateUniqueSessionId(): string {
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `SES-${Date.now()}${randomSuffix}`;
}

export function generateFutureScheduleDate(daysFromNow = 7): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(1, 35, 0, 0);

  return date.toISOString();
}

export function buildSessionPayload(
  subjectId: string,
  chamberId: string,
  apparatusId: string
): SessionPayload {
  return {
    id: generateUniqueSessionId(),
    subject_id: subjectId,
    chamber_id: chamberId,
    apparatus_id: apparatusId,
    scheduled_for: generateFutureScheduleDate()
  };
}

export function expectedScheduledFor(payload: SessionPayload): string {
  return payload.scheduled_for.replace(".000Z", "");
}

export async function createSessionSetup(
  request: APIRequestContext,
  env: AuthEnv,
  seniorCoordinatorPassword: string
): Promise<SessionSetup> {
  const cookie = await getRoleSessionCookie(
    request,
    env,
    testEnv().seniorCoordinatorRole,
    seniorCoordinatorPassword
  );

  const [subjectId, chamberId, apparatusId] = await Promise.all([
    getFirstActiveSubjectId({ request, env, cookie }),
    getFirstChamberId({ request, env, cookie }),
    getFirstApparatusId({ request, env, cookie })
  ]);

  return {
    cookie,
    payload: buildSessionPayload(subjectId, chamberId, apparatusId)
  };
}

export async function createPendingSession(
  request: APIRequestContext,
  env: AuthEnv,
  seniorCoordinatorPassword: string
): Promise<CreatedSessionSetup> {
  const setup = await createSessionSetup(request, env, seniorCoordinatorPassword);
  const response = await createSession({
    request,
    env,
    payload: setup.payload,
    cookie: setup.cookie
  });

  expect(response.status()).toBe(201);

  const responseBody = await response.json();

  return {
    ...setup,
    sessionId: responseBody.id,
    response
  };
}
