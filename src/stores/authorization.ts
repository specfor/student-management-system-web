import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import { sendGetRequest, sendJsonPostRequest } from "@/utils/requests";
import { useHeaderStore } from "./headers";

export const useAuthStore = defineStore("auth", () => {
  const LoggedIn = ref(false);
  const authToken = ref("");
  const userPermissions: Ref<{ [key: string]: string[] }> = ref({});

  async function login(email: string, password: string) {
    const data = await sendJsonPostRequest("/login", {
      email: email,
      password: password,
    });
    if (data.status === "success") {
      userPermissions.value = data.data.user.role.permissions;
      await setAuthTokenInRequiredPlaces(data.data.token);
      LoggedIn.value = true;
      return { success: true, message: "Login Successful." };
    } else {
      return { success: false, message: data.message };
    }
  }

  function logout() {
    const headerStore = useHeaderStore();

    authToken.value = "";
    localStorage.removeItem("authToken");
    headerStore.removeHeader("Authorization");
    LoggedIn.value = false;
  }

  async function checkLoggedIn() {
    if (LoggedIn.value === true) return true;

    const storedKey = localStorage.getItem("authToken");
    if (storedKey === null) return false;

    const data = await sendGetRequest(
      "/user",
      {},
      { Authorization: craftAuthorizationHeader(storedKey) }
    );
    if (data.status === "success") {
      userPermissions.value = data.data.user.role.permissions;
      await setAuthTokenInRequiredPlaces(storedKey);
      return true;
    }
    return false;
  }

  function getAuthToken() {
    return authToken.value;
  }

  function craftAuthorizationHeader(token: string) {
    return "Bearer " + token;
  }

  function setAuthTokenInRequiredPlaces(token: string) {
    const headerStore = useHeaderStore();

    authToken.value = token;
    LoggedIn.value = true;
    localStorage.setItem("authToken", token);

    headerStore.appendHeaders({
      Authorization: craftAuthorizationHeader(token),
    });
  }

  return {
    LoggedIn,
    userPermissions,
    checkLoggedIn,
    login,
    logout,
    getAuthToken,
  };
});
