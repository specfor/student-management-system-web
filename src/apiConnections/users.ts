import {
  sendDeleteRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/utils/requests";

export function getUsers(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    sort?: {
      by: "name" | "id" | "email" | "role_id" | "created_at";
      direction: "acs" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  return sendGetRequest("/users", params);
}

export function createUser(
  name: string,
  email: string,
  password: string,
  role_id: number
) {
  return sendJsonPostRequest("/users", {
    name: name,
    email: email,
    password: password,
    role_id: role_id,
  });
}

export function updateUser(
  id: number,
  name: string | null = null,
  role_id: number | null = null,
  password: string | null = null
) {
  const sendBody: { [key: string]: any } = {
    name: name,
    role_id: role_id,
  };
  if (password !== null) sendBody["password"] = password;

  return sendJsonPatchRequest(`/users/${id}`, sendBody);
}

export function deleteUser(id: number) {
  return sendDeleteRequest(`/users/${id}`);
}
