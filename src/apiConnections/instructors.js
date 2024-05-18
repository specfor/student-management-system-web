import {
  sendDeleteRequest,
  sendFileDownloadRequest,
  sendFileUploadRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest
} from '@/baseFunctions/requests'

export function getInstructors(startIndex = 0, limit = null) {
  let params = { start: startIndex }
  if (limit) params['size'] = limit

  return sendGetRequest('/instructors', params)
}

export function createInstructor(name, email, phone_number, birthday, address, work_place) {
  return sendJsonPostRequest('/instructors', {
    name: name,
    birthday: birthday,
    address: address,
    email: email,
    phone_number: phone_number,
    work_place: work_place
  })
}

export function updateInstructor(id, name, email, phone_number, birthday, address, work_place) {
  return sendJsonPatchRequest(`/instructors/${id}`, {
    name: name,
    birthday: birthday,
    address: address,
    email: email,
    phone_number: phone_number,
    work_place: work_place
  })
}

export function deleteInstructor(id) {
  return sendDeleteRequest(`/instructors/${id}`)
}

export function getInstructorsImage(id) {
  return sendFileDownloadRequest(`/instructors/${id}/image`)
}

export function updateInstructorImage(id, image) {
  return sendFileUploadRequest(`/instructors/${id}/image`, 'photo', image)
}
