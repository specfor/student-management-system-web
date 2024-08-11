import {
  sendDeleteRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest,
} from "@/utils/requests";

export function getGrades(
  startIndex = 0,
  limit: number | null = null,
  options?: {
    sort?: {
      by: "name" | "id";
      direction: "asc" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }

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
