import {
  sendDeleteRequest,
  sendFileDownloadRequest,
  sendFileUploadRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/utils/requests";

export function getStudents(
  startIndex = 0,
  limit: number | null = null,
  options?: {
    filters?: {
      name?: string;
      email?: string;
      phone_number?: string;
      grade_id?: number;
      custom_id?: string;
      admission_paid?: boolean;
    };
    sort?: {
      by: "name" | "id" | "birthday" | "email" | "grade_id" | "custom_id";
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
  if (options?.filters?.grade_id) params.grade_id = options.filters.grade_id;
  if (options?.filters?.custom_id) params.custom_id = options.filters.custom_id;
  if (options?.filters?.admission_paid !== undefined)
    params.admission_paid = options.filters.admission_paid;

  return sendGetRequest("/students", params);
}

export function getStudentById(id: number) {
  return sendGetRequest(`/students/${id}`);
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

export function markAdmissionFee(
  student_id: number,
  amount: number,
  paid: boolean,
  reduction_reason: string
) {
  if (amount == 0) paid = true;
  return sendJsonPostRequest("/student-admission-fees", {
    student_id: student_id,
    amount: amount,
    paid: paid,
    reduction_reason: reduction_reason,
  });
}

export function getAdmissionPaymentStatus(student_id: number) {
  const params: { [key: string]: any } = { student_id: student_id };
  return sendGetRequest(`/student-admission-fees`, params);
}

export function updateAdmissionFee(
  id: number,
  amount?: number,
  paid?: boolean,
  reduction_reason?: string
) {
  const params: { [key: string]: any } = {};
  if (amount) params.amount = amount;
  if (paid) params.paid = paid;
  if (reduction_reason) params.reduction_reason = reduction_reason;

  return sendJsonPatchRequest(`/student-admission-fees/${id}`);
}
