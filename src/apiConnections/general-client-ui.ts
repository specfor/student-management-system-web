import { sendGetRequest } from "@/utils/requests";

export function getGeneralClientStatus() {
  return sendGetRequest("/client-general-ui/status");
}
