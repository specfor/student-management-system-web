import { sendDeleteRequest, sendJsonPostRequest, sendGetRequest } from '@/baseFunctions/requests'

export function getAttendaceOfCourse(courseId, startIndex = 0, limit = null) {
  let params = { start: startIndex }
  if (limit) params['size'] = limit
  return sendGetRequest(`/attendance/${courseId}`, params)
}

export function sendMarkAttendance(courseId, studentId) {
  return sendJsonPostRequest('/attendance/' + courseId, {
    student_id: studentId
  })
}

export function deleteAttendance(id) {
  return sendDeleteRequest(`/attendance/${id}`)
}
