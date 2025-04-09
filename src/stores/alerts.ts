import { defineStore } from "pinia";
import { ref } from "vue";

const delayAutoRemoveAlert = 7000;

type Alert = {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  message: string;
};

export const useAlertsStore = defineStore("alerts", () => {
  const alerts = ref([] as Alert[]);
  const currentAlertId = ref(1);

  /**
   * Insert an alert into the store.
   * @param title - The title of the alert.
   * @param message - The message of the alert.
   * @param alertType - The type of the alert (success, error, info).
   * @param removeTimeout - The time in milliseconds after which the alert will be removed automatically. if -1, it won't be removed automatically.
   */
  function insertAlert(
    title: string,
    message: string,
    alertType: "success" | "error" | "info" = "success",
    removeTimeout: number = delayAutoRemoveAlert
  ) {
    alerts.value.push({
      id: currentAlertId.value,
      type: alertType,
      title: title,
      message: message,
    });
    if (removeTimeout !== -1) {
      setTimeout(removeAlert, removeTimeout, currentAlertId.value);
    }
    currentAlertId.value += 1;
  }

  function removeAlert(alertId: number) {
    alerts.value = alerts.value.filter((alert) => {
      return alert.id !== alertId;
    });
  }

  return {
    alerts,
    insertAlert,
    removeAlert,
  };
});
