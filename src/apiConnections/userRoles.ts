import {
  sendDeleteRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/baseFunctions/requests";

export function getUserRoles(startIndex = 0, limit = null) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;

  return sendGetRequest("/user-groups", params);
}

export function getAllPermissions() {
  return sendGetRequest("/permissions");
}

export function createUserRole(name: string, permissions: string[]) {
  return sendJsonPostRequest("/user-groups", {
    name: name,
    permissions: permissions,
  });
}

export function updateUserRole(
  id: number,
  name: string,
  permissions: string[]
) {
  return sendJsonPatchRequest(`/user-groups/${id}`, {
    name: name,
    permissions: permissions,
  });
}

export function deleteUserRole(id: number) {
  return sendDeleteRequest(`/user-groups/${id}`);
}
