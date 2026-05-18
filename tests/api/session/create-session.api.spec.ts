import { expect, test } from "@playwright/test";

import { createSession } from "@support/api/session/session.client.js";
import { createSessionResponseSchema } from "@support/api/session/session.schemas.js";
import { apiEnv, testEnv } from "@support/config/env.js";
import { getRoleSessionCookie } from "@support/api/auth/auth.client.js";
import {
  buildSessionPayload,
  createSessionSetup,
  expectedScheduledFor
} from "@support/helpers/session.helper.js";

test.describe("Session API", () => {
  const env = apiEnv();
  const { seniorCoordinatorPassword, testSubjectPassword, testSubjectRole } = testEnv();

  test("should create a session", async ({ request }) => {
    const setup = await createSessionSetup(request, env, seniorCoordinatorPassword);
    const response = await createSession({
      request,
      env,
      payload: setup.payload,
      cookie: setup.cookie
    });

    expect(response.status()).toBe(201);

    const rawBody = await response.json();
    const parseResult = createSessionResponseSchema.safeParse(rawBody);

    if (!parseResult.success) {
      throw new Error(`Invalid create-session response schema: ${parseResult.error.message}`);
    }

    expect(parseResult.data).toEqual({
      id: setup.payload.id,
      subject_id: setup.payload.subject_id,
      chamber_id: setup.payload.chamber_id,
      observer_role_id: null,
      scheduled_for: expectedScheduledFor(setup.payload),
      state: "pending-approval",
      completed_at: null
    });
  });

  test("should return an error if session ID already exists", async ({ request }) => {
    const setup = await createSessionSetup(request, env, seniorCoordinatorPassword);
    const firstResponse = await createSession({
      request,
      env,
      payload: setup.payload,
      cookie: setup.cookie
    });

    expect(firstResponse.status()).toBe(201);

    const duplicateResponse = await createSession({
      request,
      env,
      payload: setup.payload,
      cookie: setup.cookie
    });

    expect(duplicateResponse.status()).toBe(409);

    const rawBody = await duplicateResponse.json();

    expect(rawBody.detail).toEqual("Session ID already exists");
  });

  test("should not create a session when access is role-restricted", async ({ request }) => {
    const setup = await createSessionSetup(request, env, seniorCoordinatorPassword);
    const restrictedCookie = await getRoleSessionCookie(
      request,
      env,
      testSubjectRole,
      testSubjectPassword
    );
    const restrictedPayload = buildSessionPayload(
      setup.payload.subject_id,
      setup.payload.chamber_id,
      setup.payload.apparatus_id
    );

    const response = await createSession({
      request,
      env,
      payload: restrictedPayload,
      cookie: restrictedCookie
    });

    expect(response.status()).toBe(403);

    const rawBody = await response.json();
    expect(rawBody).toEqual({
      detail: "Requires role in ['Junior Test Coordinator', 'Senior Test Coordinator', 'Director of Enrichment']"
    });
  });
});
