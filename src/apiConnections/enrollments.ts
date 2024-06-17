import {
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest,
} from "@/baseFunctions/requests";

export function getEnrollmentsOfCourse(
  courseId: number,
  startIndex = 0,
  limit: null | number = null
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
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
  if (discount_type && discount_amount) {
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

export function getStudentEnrollments(studentId: number) {
  return sendGetRequest(`/enroll/student/${studentId}`);
}
