import {
  sendDeleteRequest,
  sendFileDownloadRequest,
  sendFileUploadRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/utils/requests";

export function getInstructors(
  startIndex = 0,
  limit: number | null = null,
  options?: {
    filters?: {
      name?: string;
      email?: string;
      phone_number?: string;
    };
    sort?: {
      by: "name" | "birthday" | "id" | "email";
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
  if (options?.filters?.name) params.name = options.filters.name;
  if (options?.filters?.email) params.email = options.filters.email;
  if (options?.filters?.phone_number)
    params.phone_number = options.filters.phone_number;

  return sendGetRequest("/instructors", params);
}

export function getInstructor(id: number) {
  return sendGetRequest(`/instructors/${id}`);
}

export function createInstructor(
  name: string,
  email: string,
  phone_number: string,
  birthday: string,
  address: string,
  work_place: string
) {
  return sendJsonPostRequest("/instructors", {
    name: name,
    birthday: birthday,
    address: address,
    email: email,
    phone_number: phone_number,
    work_place: work_place,
  });
}

export function updateInstructor(
  id: number,
  name: string,
  email: string,
  phone_number: string,
  birthday: string,
  address: string,
  work_place: string
) {
  return sendJsonPatchRequest(`/instructors/${id}`, {
    name: name,
    birthday: birthday,
    address: address,
    email: email,
    phone_number: phone_number,
    work_place: work_place,
  });
}

export function deleteInstructor(id: number) {
  return sendDeleteRequest(`/instructors/${id}`);
}

export function getInstructorsImage(id: number) {
  return sendFileDownloadRequest(`/instructors/${id}/image`);
}

export function updateInstructorImage(id: number, image: Blob) {
  return sendFileUploadRequest(`/instructors/${id}/image`, "photo", image);
}
