import { sendGetRequest, sendJsonPatchRequest } from "@/utils/requests";

export function getWhatsappSettings() {
  return sendGetRequest("/settings/whatsapp");
}

export function updateWhatsappAuthSettings(fields: {
  phone_num_id?: string;
  access_token?: string;
}) {
  const params: { [key: string]: string } = {};
  if (fields.access_token !== undefined) {
    params["access_token"] = fields.access_token;
  }
  if (fields.phone_num_id !== undefined) {
    params["from_phone_number_id"] = fields.phone_num_id;
  }
  return sendJsonPatchRequest("/settings/whatsapp/auth", params);
}

export function updateWhatsappTemplateSettings(fields: {
  [key: string]: string;
}) {
  return sendJsonPatchRequest("/settings/whatsapp/templates", fields);
}
