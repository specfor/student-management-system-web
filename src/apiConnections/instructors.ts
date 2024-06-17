import {
  sendDeleteRequest,
  sendFileDownloadRequest,
  sendFileUploadRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/baseFunctions/requests";

export function getInstructors(startIndex = 0, limit = null) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;

  return sendGetRequest("/instructors", params);
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
