import { expect, test } from "@playwright/test";

import { rejectSession } from "@support/api/session/session.client.js";
import { createSessionResponseSchema } from "@support/api/session/session.schemas.js";
import { apiEnv, testEnv } from "@support/config/env.js";
import { getRoleSessionCookie } from "@support/api/auth/auth.client.js";
import { createPendingSession, expectedScheduledFor } from "@support/helpers/session.helper.js";

test.describe("Session Rejection API", () => {
  const env = apiEnv();
  const { seniorCoordinatorPassword } = testEnv();

  test("should reject a session", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);

    const rejectResponse = await rejectSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(rejectResponse.status()).toBe(200);

    const rejectedRawBody = await rejectResponse.json();
    const rejectedSession = createSessionResponseSchema.parse(rejectedRawBody);

    expect(rejectedSession).toEqual({
      id: setup.payload.id,
      subject_id: setup.payload.subject_id,
      chamber_id: setup.payload.chamber_id,
      observer_role_id: null,
      scheduled_for: expectedScheduledFor(setup.payload),
      state: "rejected",
      completed_at: null
    });
  });

  test("should return an error when rejecting an already rejected session", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);
    const firstRejectResponse = await rejectSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(firstRejectResponse.status()).toBe(200);

    const secondRejectResponse = await rejectSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(secondRejectResponse.status()).toBe(409);

    const secondRejectBody = await secondRejectResponse.json();
    expect(secondRejectBody).toEqual({
      detail: "Cannot reject from state SessionState.rejected"
    });
  });
});

test.describe("Session not reject API", () => {
  const env = apiEnv();
  const { seniorCoordinatorPassword, testSubjectPassword, testSubjectRole } = testEnv();

  test("should not reject a session when access is role-restricted.", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);
    const cookie = await getRoleSessionCookie(request, env, testSubjectRole, testSubjectPassword);

    const response = await rejectSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie
    });

    expect(response.status()).toBe(403);

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      detail: "Requires role in ['Senior Test Coordinator', 'Director of Enrichment']"
    });
  });
});
