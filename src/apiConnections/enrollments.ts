import {
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest,
  sendDeleteRequest,
} from "@/baseFunctions/requests";

export function getEnrollmentsOfCourse(
  courseId: number,
  startIndex = 0,
  limit: null | number = null,
  options?: {
    sort?: {
      by: "student_id" | "created_at" | "id";
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

  return sendGetRequest("/enroll/" + courseId, params);
}

// export function getEnrollmentOfStudent(studentId) {
//   return sendGetRequest('/enroll?student=' + studentId)
// }

export function getStudentEnrollmentOfCourse(
  courseId: number,
  studentId: number
) {
  return sendGetRequest(`/enroll/${courseId}/${studentId}`);
}

export function enrollCourse(
  course_id: number,
  student_id: number,
  discount_type: EnrollmentPriceAdjustment["type"],
  discount_amount: number,
  discount_reason: string
) {
  const params: { [key: string]: any } = {
    student_id: student_id,
  };
  if (discount_type && discount_amount) {
    params["price_adjustment"] = {
      type: discount_type,
      reason: discount_reason,
    };
    if (discount_type == "fixed")
      params["price_adjustment"].amount = discount_amount;
    else params["price_adjustment"].percentage = discount_amount;
  }
  return sendJsonPostRequest("/enroll/" + course_id, params);
}

export function updateEnrollment(
  id: number,
  suspend: boolean,
  discount_type: EnrollmentPriceAdjustment["type"],
  discount_amount: number,
  discount_reason: string
) {
  const params: { [key: string]: any } = {
    suspend: suspend,
  };
  if (discount_type === "none") params["remove_price_adjustment"] = true;
  else if (discount_type) {
    params["price_adjustment"] = {
      type: discount_type,
      reason: discount_reason,
    };
    if (discount_type === "fixed")
      params["price_adjustment"].amount = discount_amount;
    else params["price_adjustment"].percentage = discount_amount;
  }
  return sendJsonPatchRequest(`/enroll/${id}`, params);
}

export function getStudentEnrollments(
  studentId: number,
  startIndex = 0,
  limit: null | number = null
) {
  return sendGetRequest(`/enroll/student/${studentId}`);
}

export function deleteEnrollment(id: number) {
  return sendDeleteRequest("/enroll/" + id);
}
