import {
  sendDeleteRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/utils/requests";

export function getUserRoles(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    sort?: {
      by: "role_name" | "id";
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

  return sendGetRequest("/user-groups", params);
}

export function getAllPermissions() {
  return sendGetRequest("/permissions");
}

export function createUserRole(
  name: string,
  permissions: { [key: string]: string[] }
) {
  return sendJsonPostRequest("/user-groups", {
    name: name,
    permissions: permissions,
  });
}

export function updateUserRole(
  id: number,
  name: string,
  permissions: { [key: string]: string[] }
) {
  return sendJsonPatchRequest(`/user-groups/${id}`, {
    name: name,
    permissions: permissions,
  });
}

export function deleteUserRole(id: number) {
  return sendDeleteRequest(`/user-groups/${id}`);
}
