import { sendGetRequest, sendJsonPostRequest } from "@/utils/requests";

export function getClientAuthToken() {
  return sendGetRequest("/settings/fingerprint-client/auth-token");
}

export function generateClientAuthToken() {
  return sendJsonPostRequest("/settings/fingerprint-client/auth-token", {});
}

export function checkClientSoftwareStatus() {
  return sendGetRequest("/fingerprint-client/status");
}
