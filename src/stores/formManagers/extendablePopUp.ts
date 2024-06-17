import {
  ref,
  shallowRef,
  type Component,
  type FunctionalComponent,
  type ShallowRef,
} from "vue";
import { defineStore } from "pinia";
import { ExclamationCircleIcon } from "@heroicons/vue/24/solid";

export const useExtendablePopUpStore = defineStore(
  "form-manager-extendable-pop-up",
  () => {
    const htmlBody = ref("");
    const componentObj: ShallowRef<FunctionalComponent | Component> =
      shallowRef(ExclamationCircleIcon);
    const argsPassed = ref([]);
    const show = ref(false);

    function showHtmlContent(content: string, args: any = []) {
      argsPassed.value = args;
      componentObj.value = ExclamationCircleIcon;
      htmlBody.value = content;
      show.value = true;
    }

    function showComponent(
      component: Component | FunctionalComponent,
      args = []
    ) {
      argsPassed.value = args;
      htmlBody.value = "";
      componentObj.value = component;
      show.value = true;
    }

    return {
      show,
      htmlBody,
      componentObj,
      argsPassed,
      showHtmlContent,
      showComponent,
    };
  }
);
