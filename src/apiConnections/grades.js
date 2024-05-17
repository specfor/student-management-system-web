import {
  sendDeleteRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest
} from '@/baseFunctions/requests'

export function getGrades(startIndex = 0, limit = null) {
  let params = { start: startIndex }
  if (limit) params['size'] = limit
  return sendGetRequest('/grades', params)
}

export function createGrade(name) {
  return sendJsonPostRequest('/grades', {
    name: name
  })
}

export function updateGrade(id, name) {
  return sendJsonPatchRequest(`/grades/${id}`, {
    name: name
  })
}

export function deleteGrade(id) {
  return sendDeleteRequest(`/grades/${id}`)
}
