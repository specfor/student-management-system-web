import { useHeaderStore } from '@/stores/headers'

const baseUrl = import.meta.env.VITE_API_BASE_URL

export async function sendJsonPostRequest(url, jsonBody, headers = {}) {
  url = baseUrl + url
  let headers_ = useHeaderStore().getHeaders()
  headers_ = { ...headers_, ...headers }
  headers_['Content-Type'] = 'application/json'

  let response = null
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: headers_,
      body: JSON.stringify(jsonBody),
      credentials: 'same-origin'
    })
  } catch (e) {
    return { status: 'error', message: 'Failed to connect to the servers.', data: null }
  }

  let data_
  try {
    data_ = await response.json()
    return { status: data_.status, data: data_.data ?? data_.error, message: data_.message ?? null }
  } catch (error) {
    return { status: 'error', message: 'Something went wrong.', data: null }
  }
}

export async function sendGetRequest(url, params = {}, headers = {}) {
  url = baseUrl + url
  let headers_ = useHeaderStore().getHeaders()
  headers_ = { ...headers_, ...headers }
  let response = null
  try {
    if (params) url = url + '?' + new URLSearchParams(params)
    response = await fetch(url, {
      method: 'GET',
      headers: headers_,
      credentials: 'same-origin'
    })
  } catch (e) {
    return { status: 'error', message: 'Failed to connect to the servers.', data: null }
  }

  let data_
  try {
    data_ = await response.json()
    return { status: data_.status, data: data_.data ?? data_.error, message: data_.message ?? null }
  } catch (error) {
    return { status: 'error', message: 'Something went wrong.', data: null }
  }
}
