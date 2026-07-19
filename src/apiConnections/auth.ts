import { sendJsonPostRequest } from "@/utils/requests";

export function sendForgotPasswordRequest(email: string) {
  return sendJsonPostRequest("/forgot-password", {
    email: email,
  });
}

export function sendResetPasswordRequest(
  email: string,
  token: string,
  password: string
) {
  return sendJsonPostRequest("/reset-password", {
    email: email,
    token: token,
    password: password,
  });
}
