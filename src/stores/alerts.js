import { defineStore } from 'pinia'
import { ref } from 'vue'

const delayAutoRemoveAlert = 7000

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref([])
  let currentAlertId = ref(1)

  function insertAlert(title, message, alertType = 'success') {
    alerts.value.push({
      id: currentAlertId.value,
      type: alertType,
      title: title,
      message: message
    })
    setTimeout(removeAlert, delayAutoRemoveAlert, currentAlertId.value)
    currentAlertId.value += 1
  }

  function removeAlert(alertId) {
    alerts.value = alerts.value.filter((alert) => {
      return alert.id !== parseInt(alertId)
    })
  }

  return {
    alerts,
    insertAlert,
    removeAlert
  }
})
