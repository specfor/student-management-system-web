import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import { sendGetRequest, sendJsonPostRequest } from "@/utils/requests";
import { useHeaderStore } from "./headers";

export const useAuthStore = defineStore("auth", () => {
  const LoggedIn = ref(false);
  const authToken = ref("");
  const userPermissions: Ref<{ [key: string]: string[] }> = ref({});
  const dashboardCardVisibility: Ref<{ [cardKey: string]: boolean }> = ref({});

  async function login(email: string, password: string) {
    const data = await sendJsonPostRequest("/login", {
      email: email,
      password: password,
    });
    if (data.status === "success") {
      userPermissions.value = data.data.user.role.permissions;
      dashboardCardVisibility.value = data.data.user.role.dashboard_card_visibility ?? {};
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
    dashboardCardVisibility.value = {};
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
      dashboardCardVisibility.value = data.data.user.role.dashboard_card_visibility ?? {};
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

  /**
   * Returns true if the logged-in user's role can see the given dashboard card.
   * Defaults to true when the key is absent (safe default = visible).
   */
  function canSeeCard(cardKey: string): boolean {
    if (Object.keys(dashboardCardVisibility.value).length === 0) return true;
    return dashboardCardVisibility.value[cardKey] !== false;
  }

  function hasPermission(module: string, permission: 'read' | 'write' | 'update' | 'delete'): boolean {
    if (userPermissions.value['all']) return true;
    if (userPermissions.value[module]) {
        return userPermissions.value[module].includes(permission);
    }
    return false;
  }

  return {
    LoggedIn,
    userPermissions,
    dashboardCardVisibility,
    checkLoggedIn,
    login,
    logout,
    getAuthToken,
    canSeeCard,
    hasPermission,
  };
});

