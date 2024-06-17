import { defineStore } from "pinia";
import { ref } from "vue";

const delayAutoRemoveAlert = 7000;

type Alert = {
  id: number;
  type: "success" | "error";
  title: string;
  message: string;
};

export const useAlertsStore = defineStore("alerts", () => {
  const alerts = ref([] as Alert[]);
  const currentAlertId = ref(1);

  function insertAlert(
    title: string,
    message: string,
    alertType: "success" | "error" = "success"
  ) {
    alerts.value.push({
      id: currentAlertId.value,
      type: alertType,
      title: title,
      message: message,
    });
    setTimeout(removeAlert, delayAutoRemoveAlert, currentAlertId.value);
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
