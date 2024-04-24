import { ref } from 'vue'
import { defineStore } from 'pinia'
import { sendGetRequest, sendJsonPostRequest } from '@/baseFunctions/requests'
import { useHeaderStore } from './headers'

export const useAuthStore = defineStore('auth', () => {
  const LoggedIn = ref(false)
  const authToken = ref('')

  async function login(email, password) {
    let data = await sendJsonPostRequest('/login', {
      email: email,
      password: password
    })
    console.log(data)
    if (data.status === 'success') {
      setAuthTokenInRequiredPlaces(data.data.token)
      LoggedIn.value = true
      return { success: true, message: 'Login Successful.' }
    } else {
      return { success: false, message: data.message }
    }
  }

  function logout() {
    let headerStore = useHeaderStore()

    authToken.value = ''
    localStorage.removeItem('authToken')
    headerStore.removeHeader('Authorization')
    LoggedIn.value = false
  }

  async function checkLoggedIn() {
    if (LoggedIn.value === true) return true

    let storedKey = localStorage.getItem('authToken')
    if (storedKey === null) return false

    let data = await sendGetRequest(
      '/user',
      {},
      { Authorization: craftAuthorizationHeader(storedKey) }
    )
    if (data.status === 'success') {
      setAuthTokenInRequiredPlaces(storedKey)
      return true
    }
    return false
  }

  function getAuthToken() {
    return authToken.value
  }

  function craftAuthorizationHeader(token) {
    return 'Bearer ' + token
  }

  function setAuthTokenInRequiredPlaces(token) {
    let headerStore = useHeaderStore()

    authToken.value = token
    LoggedIn.value = true
    localStorage.setItem('authToken', token)

    headerStore.appendHeaders({ Authorization: craftAuthorizationHeader(token) })
  }

  return {
    LoggedIn,
    checkLoggedIn,
    login,
    logout,
    getAuthToken
  }
})
