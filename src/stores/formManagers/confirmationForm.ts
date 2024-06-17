import { ref } from "vue";
import { defineStore } from "pinia";

export const useConfirmationFormsStore = defineStore(
  "form-manager-confirmation",
  () => {
    const confirm = ref(false);
    const open = ref(false);
    const title = ref("");
    const message = ref("");

    function newConfirmationForm(title_: string, message_: string) {
      title.value = title_;
      message.value = message_;
      confirm.value = false;
      open.value = true;
      return new Promise((resolve) => {
        const id = setInterval(() => {
          if (open.value === false) {
            clearInterval(id);
            resolve(confirm.value);
          }
        }, 200);
      });
    }

    return {
      open,
      title,
      message,
      confirm,
      newConfirmationForm,
    };
  }
);
