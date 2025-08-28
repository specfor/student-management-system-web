import { sendGetRequest } from "@/utils/requests";

export function getGeneralClientStatus() {
  return sendGetRequest("/client-general-ui/status");
}

export function getLocalFingerprintStatus() {
  return sendGetRequest("http://127.0.0.1:9000/fin-status", {}, {}, false);
}
