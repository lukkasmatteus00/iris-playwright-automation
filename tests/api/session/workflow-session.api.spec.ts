import { expect, test } from "@playwright/test";

import {
  startSession,
  completeSession,
  cancelSession
} from "@support/api/session/session.client.js";
import { createSessionResponseSchema } from "@support/api/session/session.schemas.js";
import { apiEnv, testEnv } from "@support/config/env.js";
import { createPendingSession, expectedScheduledFor } from "@support/helpers/session.helper.js";

test.describe("Session Completion API", () => {
  const env = apiEnv();
  const { seniorCoordinatorPassword } = testEnv();

  test("should start a session", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);

    const startResponse = await startSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(startResponse.status()).toBe(200);

    const startedRawBody = await startResponse.json();
    const startedSession = createSessionResponseSchema.parse(startedRawBody);

    expect(startedSession).toEqual({
      id: setup.payload.id,
      subject_id: setup.payload.subject_id,
      chamber_id: setup.payload.chamber_id,
      observer_role_id: null,
      scheduled_for: expectedScheduledFor(setup.payload),
      state: "in-progress",
      completed_at: null
    });
  });

  test("should complete a session", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);
    const startResponse = await startSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(startResponse.status()).toBe(200);

    const completeResponse = await completeSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(completeResponse.status()).toBe(200);

    const completedRawBody = await completeResponse.json();
    const completedSession = createSessionResponseSchema.parse(completedRawBody);

    expect(completedSession).toEqual({
      id: setup.payload.id,
      subject_id: setup.payload.subject_id,
      chamber_id: setup.payload.chamber_id,
      observer_role_id: null,
      scheduled_for: expectedScheduledFor(setup.payload),
      state: "completed",
      completed_at: expect.any(String)
    });
  });
});

test.describe("Session Cancellation API", () => {
  const env = apiEnv();
  const { seniorCoordinatorPassword } = testEnv();

  test("should start a session", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);

    const startResponse = await startSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(startResponse.status()).toBe(200);

    const startedRawBody = await startResponse.json();
    const startedSession = createSessionResponseSchema.parse(startedRawBody);

    expect(startedSession).toEqual({
      id: setup.payload.id,
      subject_id: setup.payload.subject_id,
      chamber_id: setup.payload.chamber_id,
      observer_role_id: null,
      scheduled_for: expectedScheduledFor(setup.payload),
      state: "in-progress",
      completed_at: null
    });
  });

  test("should cancel a session", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);
    const startResponse = await startSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(startResponse.status()).toBe(200);

    const cancelResponse = await cancelSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(cancelResponse.status()).toBe(200);

    const canceledRawBody = await cancelResponse.json();
    const canceledSession = createSessionResponseSchema.parse(canceledRawBody);

    expect(canceledSession).toEqual({
      id: setup.payload.id,
      subject_id: setup.payload.subject_id,
      chamber_id: setup.payload.chamber_id,
      observer_role_id: null,
      scheduled_for: expectedScheduledFor(setup.payload),
      state: "cancelled",
      completed_at: null
    });
  });
});
