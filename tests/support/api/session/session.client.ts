import type { APIRequestContext, APIResponse } from "@playwright/test";

import type { CookieHeader } from "@support/api/auth/auth.client.js";
import { sanitizeApiError, type AuthEnv } from "@support/config/env.js";

type CreateSessionPayload = {
  id: string;
  subject_id: string;
  chamber_id: string;
  apparatus_id: string;
  scheduled_for: string;
};

type CreateSessionParams = {
  request: APIRequestContext;
  env: AuthEnv;
  payload: CreateSessionPayload;
  cookie: CookieHeader;
};

type DeleteSessionParams = {
  request: APIRequestContext;
  env: AuthEnv;
  sessionId: string;
  cookie: CookieHeader;
};

type ApproveSessionParams = {
  request: APIRequestContext;
  env: AuthEnv;
  sessionId: string;
  cookie: CookieHeader;
};

type RejectSessionParams = {
  request: APIRequestContext;
  env: AuthEnv;
  sessionId: string;
  cookie: CookieHeader;
};

type CancelSessionParams = {
  request: APIRequestContext;
  env: AuthEnv;
  sessionId: string;
  cookie: CookieHeader;
};

type CompleteSessionParams = {
  request: APIRequestContext;
  env: AuthEnv;
  sessionId: string;
  cookie: CookieHeader;
};

type StartSessionParams = {
  request: APIRequestContext;
  env: AuthEnv;
  sessionId: string;
  cookie: CookieHeader;
};

type FetchFirstIdParams = {
  request: APIRequestContext;
  env: AuthEnv;
  cookie: CookieHeader;
};

type EndpointRequestParams = FetchFirstIdParams & {
  endpointPath: string;
};

async function safeApiRequest<T>(env: AuthEnv, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw sanitizeApiError(error, env);
  }
}

function getFirstIdFromListPayload(payload: unknown, endpointPath: string): string {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Invalid response body from ${endpointPath}`);
  }

  const asRecord = payload as Record<string, unknown>;
  const itemsCandidate =
    (Array.isArray(asRecord.items) && asRecord.items) ||
    (Array.isArray(asRecord.data) && asRecord.data) ||
    (Array.isArray(asRecord.results) && asRecord.results);

  const list = Array.isArray(payload) ? payload : itemsCandidate;

  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`No records found for ${endpointPath}`);
  }

  const first = list[0];

  if (!first || typeof first !== "object") {
    throw new Error(`Invalid first record for ${endpointPath}`);
  }

  const firstId = (first as { id?: unknown }).id;

  if (typeof firstId !== "string" || firstId.length === 0) {
    throw new Error(`First record has no string id for ${endpointPath}`);
  }

  return firstId;
}

async function requestJson({ request, env, cookie, endpointPath }: EndpointRequestParams): Promise<unknown> {
  const response = await safeApiRequest(env, () =>
    request.get(`${env.backendBaseUrl}${endpointPath}`, {
      headers: {
        accept: "application/json",
        "x-case-token": env.xCaseToken,
        Cookie: cookie
      }
    })
  );

  if (!response.ok()) {
    throw new Error(`Failed to fetch ${endpointPath}: ${response.status()}`);
  }

  return response.json();
}

async function getFirstIdFromEndpoint(params: EndpointRequestParams): Promise<string> {
  const payload = await requestJson(params);
  return getFirstIdFromListPayload(payload, params.endpointPath);
}

export async function getFirstChamberId(params: FetchFirstIdParams): Promise<string> {
  return getFirstIdFromEndpoint({ ...params, endpointPath: "/admin/chambers" });
}

export async function getFirstApparatusId(params: FetchFirstIdParams): Promise<string> {
  return getFirstIdFromEndpoint({ ...params, endpointPath: "/admin/apparatus" });
}

export async function getFirstActiveSubjectId(params: FetchFirstIdParams): Promise<string> {
  return getFirstIdFromEndpoint({ ...params, endpointPath: "/admin/subjects?status=active&limit=50&offset=0" });
}

export async function createSession({ request, env, payload, cookie }: CreateSessionParams): Promise<APIResponse> {
  return safeApiRequest(env, () =>
    request.post(`${env.backendBaseUrl}/admin/sessions`, {
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        "x-case-token": env.xCaseToken,
        Cookie: cookie
      },
      data: payload
    })
  );
}

export async function deleteSession({ request, env, sessionId, cookie }: DeleteSessionParams): Promise<APIResponse> {
  return safeApiRequest(env, () =>
    request.delete(`${env.backendBaseUrl}/admin/sessions/${sessionId}`, {
      headers: {
        accept: "*/*",
        "x-case-token": env.xCaseToken,
        Cookie: cookie
      }
    })
  );
}

export async function approveSession({ request, env, sessionId, cookie }: ApproveSessionParams): Promise<APIResponse> {
  return safeApiRequest(env, () =>
    request.post(`${env.backendBaseUrl}/admin/sessions/${sessionId}/approve`, {
      headers: {
        accept: "*/*",
        "x-case-token": env.xCaseToken,
        Cookie: cookie
      }
    })
  );
}

export async function rejectSession({ request, env, sessionId, cookie }: RejectSessionParams): Promise<APIResponse> {
  return safeApiRequest(env, () =>
    request.post(`${env.backendBaseUrl}/admin/sessions/${sessionId}/reject`, {
      headers: {
        accept: "*/*",
        "x-case-token": env.xCaseToken,
        Cookie: cookie
      }
    })
  );
}

export async function startSession({ request, env, sessionId, cookie }: StartSessionParams): Promise<APIResponse> {
  return safeApiRequest(env, () =>
    request.post(`${env.backendBaseUrl}/admin/sessions/${sessionId}/start`, {
      headers: {
        accept: "*/*",
        "x-case-token": env.xCaseToken,
        Cookie: cookie
      }
    })
  );
}

export async function cancelSession({ request, env, sessionId, cookie }: CancelSessionParams): Promise<APIResponse> {
  return safeApiRequest(env, () =>
    request.post(`${env.backendBaseUrl}/admin/sessions/${sessionId}/cancel`, {
      headers: {
        accept: "*/*",
        "x-case-token": env.xCaseToken,
        Cookie: cookie
      }
    })
  );
}

export async function completeSession({ request, env, sessionId, cookie }: CompleteSessionParams): Promise<APIResponse> {
  return safeApiRequest(env, () =>
    request.post(`${env.backendBaseUrl}/admin/sessions/${sessionId}/complete`, {
      headers: {
        accept: "*/*",
        "x-case-token": env.xCaseToken,
        Cookie: cookie
      }
    })
  );
}
