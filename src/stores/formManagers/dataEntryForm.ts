import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import type { CheckboxFields } from "@/types/inputBoxTypes";

export const useDataEntryFormsStore = defineStore(
  "form-manager-data-entry",
  () => {
    const show = ref(false);
    const submitted = ref(false);
    const success = ref(false);
    const title = ref("");
    const fields: Ref<InputField[]> = ref([]);
    const fieldValues: Ref<{
      [key: string]:
        | string
        | number
        | boolean
        | { [key: string]: string | boolean | number };
    }> = ref({});
    const successBtnText = ref("");
    const errorMessages: Ref<{ [key: string]: string }> = ref({});
    const allowSubmit = ref(false);
    const previewUrls: Ref<{ [key: string]: string }> = ref({});
    const generalErrorMessages: Ref<{ [key: string]: string }> = ref({});

    function newDataEntryForm(
      title_: string,
      successBtn_: string,
      fields_: InputField[],
      options: {
        allowSubmit: boolean;
      } = { allowSubmit: false }
    ) {
      fieldValues.value = {};
      success.value = false;
      title.value = title_;
      fields.value = fields_;
      successBtnText.value = successBtn_;
      submitted.value = false;
      allowSubmit.value = options.allowSubmit;
      previewUrls.value = [];
      errorMessages.value = {};
      generalErrorMessages.value = {};

      for (const field of fields_) {
        if (field["type"] === "checkbox") {
          fieldValues.value[field["name"]] = {};
          if (field["options"] !== undefined)
            for (const option of field["options"]) {
              fieldValues.value[field["name"]][option["name"]] =
                !!option["checked"];
            }
        } else if (field["type"] === "heading" || field["type"] === "message") {
          continue;
        } else {
          if (field["value"]) fieldValues.value[field["name"]] = field["value"];
          else fieldValues.value[field["name"]] = "";
        }
        errorMessages.value[field["name"]] = "";
      }
      show.value = true;
    }

    function waitForSubmittedData() {
      success.value = false;
      submitted.value = false;
      return new Promise<{
        data: typeof fieldValues.value;
        submitted: boolean;
      }>((resolve) => {
        const id = setInterval(() => {
          if (submitted.value) {
            clearInterval(id);
            resolve({ data: fieldValues.value, submitted: success.value });
          }
        }, 200);
      });
    }

    function finishSubmission() {
      submitted.value = false;
      show.value = false;
    }

    function insertErrorMessage(fieldName: string, errMessage: string) {
      const fieldKeys = Object.keys(fieldValues.value);
      if (fieldKeys.includes(fieldName))
        errorMessages.value[fieldName] = errMessage;
      else generalErrorMessages.value[fieldName] = errMessage;
    }

    function removeErrorMessage(fieldName: string) {
      const fieldKeys = Object.keys(fieldValues.value);
      if (fieldKeys.includes(fieldName)) delete errorMessages.value[fieldName];
      else delete generalErrorMessages.value[fieldName];
    }

    return {
      show,
      submitted,
      allowSubmit,
      previewUrls,
      success,
      title,
      fields,
      fieldValues,
      successBtnText,
      errorMessages,
      generalErrorMessages,
      newDataEntryForm,
      waitForSubmittedData,
      finishSubmission,
      insertErrorMessage,
      removeErrorMessage,
    };
  }
);

type InputField = InputTypes & {
  text?: string;
  name: string;
  required?: boolean;
  validate?: Function;
};

type InputTypes =
  | Checkbox
  | {
      type:
        | "select"
        | "textarea"
        | "message"
        | "heading"
        | "file"
        | "text"
        | "password";
      disabled?: boolean;
      value?: string | number | boolean;
    };

export type Checkbox = CheckboxFields & {
  type: "checkbox";
  name: string;
};
