import { expect, test } from "@playwright/test";

import { approveSession } from "@support/api/session/session.client.js";
import { createSessionResponseSchema } from "@support/api/session/session.schemas.js";
import { apiEnv, testEnv } from "@support/config/env.js";
import { getRoleSessionCookie } from "@support/api/auth/auth.client.js";
import {
  createPendingSession,
  expectedScheduledFor,
  generateUniqueSessionId
} from "@support/helpers/session.helper.js";

test.describe("Session Approval API", () => {
  const env = apiEnv();
  const { seniorCoordinatorPassword } = testEnv();

  test("should approve a session", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);

    const approveResponse = await approveSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(approveResponse.status()).toBe(200);

    const approvedRawBody = await approveResponse.json();
    const approvedSession = createSessionResponseSchema.parse(approvedRawBody);

    expect(approvedSession).toEqual({
      id: setup.payload.id,
      subject_id: setup.payload.subject_id,
      chamber_id: setup.payload.chamber_id,
      observer_role_id: null,
      scheduled_for: expectedScheduledFor(setup.payload),
      state: "approved",
      completed_at: null
    });
  });

  test("should return an error when approving an already approved session", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);
    const firstApproveResponse = await approveSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(firstApproveResponse.status()).toBe(200);

    const secondApproveResponse = await approveSession({
      request,
      env,
      sessionId: setup.sessionId,
      cookie: setup.cookie
    });

    expect(secondApproveResponse.status()).toBe(409);

    const secondApproveBody = await secondApproveResponse.json();
    expect(secondApproveBody).toEqual({
      detail: "Cannot approve from state SessionState.approved"
    });
  });

  test("should return not found when approving an invalid session id", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);
    const invalidSessionId = generateUniqueSessionId();

    const response = await approveSession({
      request,
      env,
      sessionId: invalidSessionId,
      cookie: setup.cookie
    });

    expect(response.status()).toBe(404);

    const responseBody = await response.json();
    expect(responseBody.detail).toEqual("Session not found");
  });
});

test.describe("Session not approve API", () => {
  const env = apiEnv();
  const { seniorCoordinatorPassword, testSubjectPassword, testSubjectRole } = testEnv();

  test("should not approve a session when access is role-restricted.", async ({ request }) => {
    const setup = await createPendingSession(request, env, seniorCoordinatorPassword);
    const cookie = await getRoleSessionCookie(request, env, testSubjectRole, testSubjectPassword);

    const response = await approveSession({
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
