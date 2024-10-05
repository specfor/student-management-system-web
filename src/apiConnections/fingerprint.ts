import { sendGetRequest, sendJsonPostRequest } from "@/utils/requests";

export function getFingerprintRegStatus() {
  return sendGetRequest("/fingerprint-reg/status");
}

export function setFingerprintMode(
  mode: "verify" | "register",
  student_id?: number
) {
  return sendJsonPostRequest("/fingerprint-client/mode", { mode, student_id });
}
