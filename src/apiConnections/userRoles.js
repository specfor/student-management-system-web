import {
  sendDeleteRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest
} from '@/baseFunctions/requests'

export function getUserRoles(startIndex = 0, limit = null) {
  let params = { start: startIndex }
  if (limit) params['size'] = limit

  return sendGetRequest('/user-groups', params)
}

export function getAllPermissions() {
  return sendGetRequest('/permissions')
}

export function createUserRole(name, permissions) {
  return sendJsonPostRequest('/user-groups', {
    name: name,
    permissions: permissions
  })
}

export function updateUserRole(id, name, permissions) {
  return sendJsonPatchRequest(`/user-groups/${id}`, {
    name: name,
    permissions: permissions
  })
}

export function deleteUserRole(id) {
  return sendDeleteRequest(`/user-groups/${id}`)
}
