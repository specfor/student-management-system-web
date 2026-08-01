import { sendGetRequest, sendJsonPostRequest } from "@/utils/requests";

export function getFingerprintRegStatus() {
  return sendGetRequest("/fingerprint-reg/status");
}

export function setFingerprintMode(
  mode: "register" | "register-rfid" | "verify",
  student_id: number | null = null
) {
  return sendJsonPostRequest("/fingerprint-client/mode", { mode, student_id });
}

export function forceAssignRfid() {
  return sendJsonPostRequest("/fingerprint-client/force-assign-rfid", {});
}
