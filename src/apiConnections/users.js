import {
  sendDeleteRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest
} from '@/baseFunctions/requests'

export function getUsers() {
  return sendGetRequest('/users')
}

export function createUser(name, email, password, role_id) {
  return sendJsonPostRequest('/users', {
    name: name,
    email: email,
    password: password,
    role_id: role_id
  })
}

export function updateUser(id, name = null, role_id = null, password = null) {
  let sendBody = {
    name: name,
    role_id: role_id
  }
  if (password !== null) sendBody['password'] = password

  return sendJsonPatchRequest(`/users/${id}`, sendBody)
}

export function deleteUser(id) {
  return sendDeleteRequest(`/users/${id}`)
}
