import { expect, test } from "@playwright/test";
import { loginWithRole } from "@support/api/auth/auth.client.js";
import {
  loginResponseSchema,
  loginErrorResponseSchema
} from "@support/api/auth/auth.schemas.js";
import { apiEnv, testEnv } from "@support/config/env.js";

test.describe("Auth API", () => {
  const env = apiEnv();
  const { seniorCoordinatorPassword, seniorCoordinatorRole } = testEnv();

  test("should login as senior coordinator and return role data", async ({ request }) => {
    const response = await loginWithRole({
      request,
      env,
      roleId: seniorCoordinatorRole,
      password: seniorCoordinatorPassword
    });

    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    const parseResult = loginResponseSchema.safeParse(payload);

    if (!parseResult.success) {
      throw new Error(`Invalid login response schema: ${parseResult.error.message}`);
    }

    expect(parseResult.data.role.slug).toEqual(seniorCoordinatorRole);
    expect(parseResult.data.role.name).toEqual("Senior Test Coordinator");
  });

  test("should fail to login with incorrect role or password", async ({ request }) => {
    const response = await loginWithRole({
      request,
      env,
      roleId: "test_wrong_user",
      password: seniorCoordinatorPassword
    });

    expect(response.status()).toBe(401);

    const responseBody = await response.json();
    const parseResult = loginErrorResponseSchema.safeParse(responseBody);

    if (!parseResult.success) {
      throw new Error(`Invalid login response schema: ${parseResult.error.message}`);
    }

    expect(parseResult.data.detail.message).toContain("Authentication failed");
  });
});
