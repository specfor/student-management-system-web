import { sendJsonPatchRequest, sendJsonPostRequest, sendGetRequest } from '@/baseFunctions/requests'

export function getEnrollmentsOfCourse(courseId, startIndex = 0, limit = null) {
  let params = { start: startIndex }
  if (limit) params['size'] = limit
  return sendGetRequest('/enroll/' + courseId, params)
}

// export function getEnrollmentOfStudent(studentId) {
//   return sendGetRequest('/enroll?student=' + studentId)
// }

export function getStudentEnrollmentOfCourse(courseId, studentId) {
  return sendGetRequest(`/enroll/${courseId}/${studentId}`)
}

export function enrollCourse(
  course_id,
  student_id,
  discount_type,
  discount_amount,
  discount_reason
) {
  let params = {
    student_id: student_id
  }
  if (discount_type && discount_amount) {
    params['price_adjustment'] = {
      type: discount_type,
      reason: discount_reason
    }
    if (discount_type === 'amount') params['price_adjustment'].amount = discount_amount
    else params['price_adjustment'].percentage = discount_amount
  }
  return sendJsonPostRequest('/enroll/' + course_id, params)
}

export function updateEnrollment(id, suspend, discount_type, discount_amount, discount_reason) {
  let params = {
    suspend: suspend
  }
  if (discount_type && discount_amount) {
    params['price_adjustment'] = {
      type: discount_type,
      reason: discount_reason
    }
    if (discount_type === 'amount') params['price_adjustment'].amount = discount_amount
    else params['price_adjustment'].percentage = discount_amount
  }
  return sendJsonPatchRequest(`/enroll/${id}`, params)
}
