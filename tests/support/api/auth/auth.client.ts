import type { APIRequestContext, APIResponse } from "@playwright/test";

import { sanitizeApiError, type AuthEnv } from "@support/config/env.js";

export type CookieHeader = `iris_role_session=${string}`;

const cachedRoleSessionCookies = new Map<string, CookieHeader>();

type LoginRequestParams = {
  request: APIRequestContext;
  env: AuthEnv;
  roleId: string;
  password: string;
};

export async function loginWithRole({ request, env, roleId, password }: LoginRequestParams): Promise<APIResponse> {
  try {
    return await request.post(`${env.backendBaseUrl}/auth/login`, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "x-case-token": env.xCaseToken
      },
      form: {
        role_id: roleId,
        password
      }
    });
  } catch (error) {
    throw sanitizeApiError(error, env);
  }
}

export async function getRoleSessionCookie(request: APIRequestContext, env: AuthEnv, roleId: string, password: string): Promise<CookieHeader> {
  const cacheKey = `${roleId}:${password}`;
  const cachedCookie = cachedRoleSessionCookies.get(cacheKey);

  if (cachedCookie) {
    return cachedCookie;
  }

  const response = await loginWithRole({
    request,
    env,
    roleId,
    password
  });

  if (!response.ok()) {
    throw new Error(`Failed to authenticate for admin endpoints: ${response.status()}`);
  }

  const setCookie = response.headers()["set-cookie"];
  const match = setCookie?.match(/iris_role_session=([^;]+)/);

  if (!match?.[1]) {
    throw new Error("Could not read iris_role_session cookie from login response");
  }

  const cookie = `iris_role_session=${match[1]}` as CookieHeader;
  cachedRoleSessionCookies.set(cacheKey, cookie);
  return cookie;
}
