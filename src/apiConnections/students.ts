import {
  sendDeleteRequest,
  sendFileDownloadRequest,
  sendFileUploadRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/baseFunctions/requests";

export function getStudents(startIndex = 0, limit: number | null = null) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;

  return sendGetRequest("/students", params);
}

export function createStudent(
  custom_id: string,
  name: string,
  fullname: string,
  grade_id: number,
  email: string,
  birthday: string,
  phone_number: string,
  address: string,
  school: string,
  parent_name: string,
  parent_phone_number: string
) {
  return sendJsonPostRequest("/students", {
    custom_id: custom_id,
    name: name,
    full_name: fullname,
    birthday: birthday,
    address: address,
    email: email,
    school: school,
    grade_id: grade_id,
    phone_number: phone_number,
    parent_name: parent_name,
    parent_phone_number: parent_phone_number,
  });
}

export function updateStudent(
  id: number,
  custom_id: string,
  name: string,
  fullname: string,
  grade_id: number,
  email: string,
  birthday: string,
  phone_number: string,
  address: string,
  school: string,
  parent_name: string,
  parent_phone_number: string
) {
  return sendJsonPatchRequest(`/students/${id}`, {
    custom_id: custom_id,
    name: name,
    full_name: fullname,
    birthday: birthday,
    address: address,
    email: email,
    school: school,
    grade_id: grade_id,
    phone_number: phone_number,
    parent_name: parent_name,
    parent_phone_number: parent_phone_number,
  });
}

export function deleteStudent(id: number) {
  return sendDeleteRequest(`/students/${id}`);
}

export function downloadStudentImage(id: number) {
  return sendFileDownloadRequest(`/students/${id}/image`);
}

export function updateStudentImage(id: number, image: Blob) {
  return sendFileUploadRequest(`/students/${id}/image`, "photo", image);
}
