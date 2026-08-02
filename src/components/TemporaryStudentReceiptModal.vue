<script setup lang="ts">
import { ref, watch } from "vue";
import PopUpPlaceholder from "./popUpPlaceholder.vue";
import {
  getTemporaryStudentReceiptData,
  getTemporaryStudentReceiptImage,
} from "@/apiConnections/temporaryStudents";
import { sendBillPrintCommand } from "@/apiConnections/billPrint";
import { useAlertsStore } from "@/stores/alerts";
import { PrinterIcon, ArrowDownTrayIcon, XMarkIcon } from "@heroicons/vue/24/solid";

const props = defineProps<{
  show: boolean;
  temporaryStudentId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const alertStore = useAlertsStore();
const loading = ref(false);
const disableBtns = ref(false);
const receiptImageSrc = ref<string | null>(null);
const imageMetadata = ref<any>(null);

watch(
  () => props.show,
  async (newVal) => {
    if (newVal && props.temporaryStudentId !== -1) {
      await loadReceiptImage();
    } else {
      receiptImageSrc.value = null;
      imageMetadata.value = null;
    }
  }
);

async function loadReceiptImage() {
  loading.value = true;
  receiptImageSrc.value = null;
  try {
    const resp = await getTemporaryStudentReceiptImage(props.temporaryStudentId);
    if (resp.status === "success" && resp.data?.image) {
      imageMetadata.value = resp.data.image;
      receiptImageSrc.value = `data:${resp.data.image.mime_type};base64,${resp.data.image.image_data}`;
    } else {
      alertStore.insertAlert("Error", resp.message || "Failed to load receipt image.", "error");
    }
  } catch (err) {
    alertStore.insertAlert("Error", "An error occurred while loading the receipt preview.", "error");
  } finally {
    loading.value = false;
  }
}

async function printReceipt() {
  disableBtns.value = true;
  let error = { occurred: false, header: "", body: "" };

  try {
    const bResp = await getTemporaryStudentReceiptData(props.temporaryStudentId);
    if (bResp.status !== "success") {
      error.occurred = true;
      error.header = "Receipt generation failed";
      error.body = bResp.message;
    } else {
      const pResp = await sendBillPrintCommand(bResp.data.bill);
      if (pResp.status === "success") {
        if (pResp.data.code !== 0) {
          error.occurred = true;
          error.header = "Error printing receipt";
          error.body = pResp.data.message;
        } else {
          if ((pResp as any).remote) {
            alertStore.insertAlert("Remote Printing", "Trying to print remotely via the front-desk printer...", "info");
          } else {
            alertStore.insertAlert("Printed", "Receipt sent to printer successfully.", "success");
          }
        }
      } else {
        error.occurred = true;
        error.header = "Printer not found";
        error.body = "No connection to the local printer (127.0.0.1:9000).";
      }
    }
  } catch (err) {
    error.occurred = true;
    error.header = "Error";
    error.body = "An unexpected error occurred while printing.";
  }

  if (error.occurred) {
    alertStore.insertAlert(error.header, error.body, "error");
  }
  disableBtns.value = false;
}

async function downloadReceiptImage() {
  if (!imageMetadata.value) {
    await loadReceiptImage();
  }
  if (!imageMetadata.value) return;

  disableBtns.value = true;
  try {
    const imageData = imageMetadata.value;
    const byteCharacters = atob(imageData.image_data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: imageData.mime_type });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = imageData.filename || `temp_receipt_${props.temporaryStudentId}.jpg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alertStore.insertAlert("Downloaded", "Receipt image downloaded successfully.", "success");
  } catch (error) {
    alertStore.insertAlert("Download Error", "An error occurred while downloading the receipt image.", "error");
  }
  disableBtns.value = false;
}
</script>

<template>
  <PopUpPlaceholder :show="show" :options="{ closeByEsc: true }">
    <div class="p-6 bg-white rounded-lg shadow-xl max-w-md w-full min-w-[360px] flex flex-col items-center">
      <div class="flex justify-between items-center w-full pb-4 border-b border-slate-200 mb-4">
        <h3 class="font-bold text-xl text-slate-800">Temporary Registration Receipt</h3>
        <button
          @click="emit('close')"
          class="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <div class="w-full flex justify-center items-center min-h-[300px] bg-slate-50 rounded-lg border border-slate-200 p-2 mb-6 overflow-hidden">
        <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-slate-500">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
          <p class="text-sm">Generating receipt preview...</p>
        </div>
        <img
          v-else-if="receiptImageSrc"
          :src="receiptImageSrc"
          alt="Receipt Preview"
          class="max-w-full h-auto max-h-[500px] object-contain shadow-sm border border-slate-300 rounded"
        />
        <div v-else class="text-slate-400 text-sm py-12 text-center">
          Failed to load receipt preview.
        </div>
      </div>

      <div class="flex gap-3 w-full justify-end">
        <button
          @click="downloadReceiptImage"
          :disabled="disableBtns || loading"
          class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors disabled:opacity-50"
        >
          <ArrowDownTrayIcon class="w-5 h-5 text-slate-600" />
          <span>Download</span>
        </button>
        <button
          @click="printReceipt"
          :disabled="disableBtns || loading"
          class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors disabled:opacity-50"
        >
          <PrinterIcon class="w-5 h-5 text-white" />
          <span>Print Receipt</span>
        </button>
      </div>
    </div>
  </PopUpPlaceholder>
</template>
