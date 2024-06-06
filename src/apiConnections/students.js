import {
  sendDeleteRequest,
  sendFileDownloadRequest,
  sendFileUploadRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest
} from '@/baseFunctions/requests'

export function getStudents(startIndex = 0, limit = null) {
  let params = { start: startIndex }
  if (limit) params['size'] = limit

  return sendGetRequest('/students', params)
}

export function createStudent(
  custom_id,
  name,
  fullname,
  grade_id,
  email,
  birthday,
  phone_number,
  address,
  school,
  parent_name,
  parent_phone_number
) {
  return sendJsonPostRequest('/students', {
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
    parent_phone_number: parent_phone_number
  })
}

export function updateStudent(
  id,
  custom_id,
  name,
  fullname,
  grade_id,
  email,
  birthday,
  phone_number,
  address,
  school,
  parent_name,
  parent_phone_number
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
    parent_phone_number: parent_phone_number
  })
}

export function deleteStudent(id) {
  return sendDeleteRequest(`/students/${id}`)
}

export function downloadStudentImage(id) {
  return sendFileDownloadRequest(`/students/${id}/image`)
}

export function updateStudentImage(id, image) {
  return sendFileUploadRequest(`/students/${id}/image`, 'photo', image)
}
