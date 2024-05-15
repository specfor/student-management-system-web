import { sendDeleteRequest, sendJsonPostRequest, sendGetRequest } from '@/baseFunctions/requests'

export function getAttendaceOfCourse(courseId) {
  return sendGetRequest(`/attendance/${courseId}`)
}

export function sendMarkAttendance(courseId, studentId) {
  return sendJsonPostRequest('/attendance/' + courseId, {
    student_id: studentId
  })
}

export function deleteAttendance(id) {
  return sendDeleteRequest(`/attendance/${id}`)
}
