import {
  sendDeleteRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest,
} from "@/baseFunctions/requests";

export function getGrades(startIndex = 0, limit = null) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  return sendGetRequest("/grades", params);
}

export function createGrade(name: string) {
  return sendJsonPostRequest("/grades", {
    name: name,
  });
}

export function updateGrade(id: number, name: string) {
  return sendJsonPatchRequest(`/grades/${id}`, {
    name: name,
  });
}

export function deleteGrade(id: number) {
  return sendDeleteRequest(`/grades/${id}`);
}
