// FILE: student-app/src/api/client.ts

// src/api/client.ts
// Thin wrapper matching the backend's { success, message, data } envelope
// (src/utils/response.js on the backend). Kept deliberately dependency-free.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://waapi-h6e7b5g9cmfthkhn.centralindia-01.azurewebsites.net/api";

const TOKEN_KEY = "student_erp_token"; // separate namespace from the admin app's "erp_token"

export type ApiEnvelope<T> = { success: boolean; message: string; data: T };

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body: unknown = null
): Promise<ApiEnvelope<T>> {
  const token = getToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body && !isForm) headers["Content-Type"] = "application/json"; // FormData: browser sets the multipart boundary itself
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
  });

  if (res.status === 204) return { success: true, message: "", data: null as T };

  let data: any = null;
  try { data = await res.json(); } catch { /* non-JSON error body */ }

  if (res.status === 401) {
    clearToken();
    onUnauthorized?.();
    throw new ApiError(data?.message || "Session expired. Please login again.", 401);
  }

  if (!res.ok) {
    throw new ApiError(data?.message || data?.error || "Something went wrong. Please try again.", res.status);
  }

  return data as ApiEnvelope<T>;
}

// ── Typed convenience wrappers (grows as more student routes ship) ────────
export const StudentApi = {
  login: (identifier: string, password: string) =>
    apiRequest("/student/auth/login", "POST", { identifier, password }),
  me: () => apiRequest("/student/auth/me"),
  updateProfile: (photo_url: string) => apiRequest("/student/auth/me", "PUT", { photo_url }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest("/student/auth/change-password", "POST", { currentPassword, newPassword }),
  logout: () => apiRequest("/student/auth/logout", "POST"),

  sendResetOtp: (phone: string) => apiRequest("/student/auth/forgot-password/send-otp", "POST", { phone }),
  verifyResetOtp: (phone: string, otp: string) =>
    apiRequest("/student/auth/forgot-password/verify-otp", "POST", { phone, otp }),
  resetPassword: (resetToken: string, newPassword: string) =>
    apiRequest("/student/auth/forgot-password/reset", "POST", { resetToken, newPassword }),

  dashboard: () => apiRequest("/student/dashboard"),
  notifications: () => apiRequest("/student/dashboard/notifications"),
  markNotificationRead: (id: string) => apiRequest(`/student/dashboard/notifications/${id}/read`, "PUT"),

  // Inbox (chat view of announcements)
  inbox: (limit = 50) => apiRequest(`/student/inbox?limit=${limit}`),
  inboxUnread: () => apiRequest("/student/inbox/unread-count"),
  conversation: (messageId: string) => apiRequest(`/student/inbox/${messageId}`),
  conversationReplies: (messageId: string, sinceSeq: number) =>
    apiRequest(`/student/inbox/${messageId}/replies?since_seq=${sinceSeq}`),
  sendReply: (messageId: string, form: FormData) =>
    apiRequest(`/student/inbox/${messageId}/reply`, "POST", form),

  // Push (FCM) device token
  registerDevice: (fcm_token: string) => apiRequest("/student/device-tokens", "POST", { fcm_token, platform: "android" }),
  unregisterDevice: (fcm_token: string) => apiRequest("/student/device-tokens", "DELETE", { fcm_token }),

  attendanceHistory: (from?: string, to?: string) => {
    const qs = from && to ? `?from=${from}&to=${to}` : "";
    return apiRequest(`/student/attendance/me/history${qs}`);
  },

  feeAccount: () => apiRequest("/student/fees/me"),
  homework: () => apiRequest("/homework/mine"),

  examGroups: () => apiRequest("/student/results/exam-groups"),
  reportCard: (examGroupId: string) => apiRequest(`/student/results/report-card?exam_group_id=${examGroupId}`),
  resultTrend: () => apiRequest("/student/results/trend"),

  razorpayCreateOrder: (amount_paise: number) =>
    apiRequest("/student/payments/razorpay/create-order", "POST", { amount_paise }),
  razorpayVerify: (payload: Record<string, unknown>) =>
    apiRequest("/student/payments/razorpay/verify", "POST", payload),
  cashfreeCreateOrder: (amount_paise: number) =>
    apiRequest("/student/payments/cashfree/create-order", "POST", { amount_paise }),
  cashfreeVerify: (payload: Record<string, unknown>) =>
    apiRequest("/student/payments/cashfree/verify", "POST", payload),
  // The server answers HTTP 409 "still being processed" while Cashfree has not finalised the payment yet
  // (UPI / netbanking can take a few seconds). Retry a few times before reporting it as pending.
  cashfreeVerifyWithRetry: async (payload: Record<string, unknown>, tries = 4, delayMs = 3000) => {
    let lastErr: unknown;
    for (let i = 1; i <= tries; i++) {
      try {
        return await apiRequest("/student/payments/cashfree/verify", "POST", payload);
      } catch (e: any) {
        lastErr = e;
        if (e?.status !== 409) throw e; // real failure -> do not retry
        if (i < tries) await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw lastErr;
  },

  // Quick Tests — thin bridge to the school's GAS/Sheets backend. Same
  // action/payload contract as before (fetchTest, getTestRegistry,
  // submitResult, ...); only the transport now goes through our normal
  // token + apiRequest instead of a separate localStorage key.
  quickTestsGasSync: (action: string, payload: Record<string, unknown> = {}) =>
    apiRequest<any>("/student/quick-tests/gas-sync", "POST", { action, payload }),
};
