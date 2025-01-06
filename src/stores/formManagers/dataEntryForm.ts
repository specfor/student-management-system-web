import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import type {
  CheckboxFields,
  FileInputFields,
  SelectionBoxFields,
} from "@/types/inputBoxTypes";

export const useDataEntryFormsStore = defineStore(
  "form-manager-data-entry",
  () => {
    const show = ref(false);
    const submitted = ref(false);
    const success = ref(false);
    const title = ref("");
    const fields: Ref<(InputField | MessageField)[]> = ref([]);
    const fieldValues: Ref<{
      [key: string]:
        | string
        | number
        | boolean
        | any[]
        | { [key: string]: string | boolean | number | Array<any> };
    }> = ref({});
    const successBtnText = ref("");
    const errorMessages: Ref<{ [key: string]: string }> = ref({});
    const allowSubmit = ref(false);
    const generalErrorMessages: Ref<{ [key: string]: string }> = ref({});

    function newDataEntryForm(
      title_: string,
      successBtn_: string,
      fields_: (InputField | MessageField)[],
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
      errorMessages.value = {};
      generalErrorMessages.value = {};

      for (const field of fields_) {
        if (field.type === "heading" || field.type === "message") {
          continue;
        } else {
          const t: InputField = field as InputField;
          if (t.type === "checkbox") {
            fieldValues.value[t.name] = {};
            if (t.options !== undefined)
              for (const option of t["options"]) {
                (fieldValues.value[t.name] as { [key: string]: boolean })[
                  option.name
                ] = !!option.checked;
              }
          } else {
            if ("value" in t && "name" in t && t.value)
              fieldValues.value[t.name] = t.value;
            else fieldValues.value[t.name] = "";
          }

          errorMessages.value[t.name] = "";
        }
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

export type InputField = InputTypes & {
  text?: string;
  name: string;
  required?: boolean;
  validate?: (value: any) => string | null;
};

type InputTypes =
  | Checkbox
  | FileInput
  | SelectionBox
  | {
      type:
        | "textarea"
        | "text"
        | "password"
        | "date"
        | "month"
        | "time"
        | "number"
        | "hidden";
      disabled?: boolean;
      value?: string | number | boolean | null;
      min?: number;
      max?: number;
    };

type Checkbox = CheckboxFields & {
  type: "checkbox";
  name: string;
};

type FileInput = FileInputFields & {
  type: "file";
  name: string;
};

type SelectionBox = SelectionBoxFields & {
  type: "select";
  name: string;
};

export type MessageField = {
  type: "message" | "heading";
  text: string;
};
