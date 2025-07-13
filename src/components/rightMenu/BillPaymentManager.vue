<script setup lang="ts">
import { updateBillStatus } from "@/apiConnections/billPrint";
import { refundStudentPayment } from "@/apiConnections/payments";
import { useAlertsStore } from "@/stores/alerts";
import { ref } from "vue";

const alertStore = useAlertsStore();

const buttonsDisabled = ref(false);
const refundReason = ref("");
const refundErrorMsg = ref("");

const props = defineProps<{
  payment: {
    billId: number;
    id: number;
    course: string;
    student: string;
    amount: string;
  };
}>();

const emit = defineEmits<{
  close: [];
  closeAndRefreshBills: [];
}>();

function close(refreshBills = false) {
  if (refreshBills) emit("closeAndRefreshBills");
  else emit("close");
}

async function justRemovePaymentFromBill() {
  buttonsDisabled.value = true;

  let resp = await updateBillStatus(props.payment.billId, "pending", [props.payment.id]);
  if (resp.status == "success") close(true);
  else alertStore.insertAlert("Failed to Remove Payment", resp.message, "error");

  buttonsDisabled.value = false;
}

async function refundAndRemovePayment() {
  buttonsDisabled.value = true;

  if (refundReason.value.length == 0) {
    refundErrorMsg.value = "Reason to refund is needed.";
  } else {
    let resp = await refundStudentPayment(props.payment.id, refundReason.value);
    if (resp.status == "success") close(true);
    else alertStore.insertAlert("Failed to Refund Payment", resp.message, "error");
  }

  buttonsDisabled.value = false;
}
</script>

<template>
  <div class="py-4 px-10">
    <h3 class="mt-2 mb-8 text-xl font-bold">Remove Payment From Receipt</h3>

    <div class="grid grid-cols-6 gap-4 font-semibold text-lg border-b-2 border-slate-300 mb-2">
      <p>ID</p>
      <p class="col-span-2">Course</p>
      <p class="col-span-2">Student Name</p>
      <p>Paid Amount</p>
    </div>
    <div class="grid grid-cols-6 gap-4">
      <p>{{ props.payment.id }}</p>
      <p class="col-span-2">{{ props.payment.course }}</p>
      <p class="col-span-2">{{ props.payment.student }}</p>
      <p class="justify-self-end">{{ props.payment.amount }}</p>
    </div>

    <p class="mt-10 font-semibold">Options</p>
    <div class="grid grid-cols-3 ml-5">
      <p>Refund & Remove</p>
      <p class="col-span-2">Refund the payment and remove it from the receipt.</p>
      <p>Remove</p>
      <p class="col-span-2">Just remove the payemnt from the receipt.</p>
    </div>

    <div class="grid grid-cols-3 mt-10 gap-x-5">
      <p class="justify-self-end">Refund Reason (needed only for refunding)</p>
      <div class="w-full col-span-2">
        <input v-model="refundReason" type="text" class="w-full border border-slate-300 px-3 py-1" />
        <p class="bg-red-300 text-red-700 px-5" v-show="refundErrorMsg.length > 0">{{ refundErrorMsg }}</p>
      </div>
    </div>
  </div>
  <div class="flex mt-10 justify-end gap-3 text-white bg-slate-200 py-3 px-5">
    <button
      class="border py-1 px-4 rounded-md bg-violet-600 hover:bg-violet-800 active:bg-violet-900 disabled:bg-violet-300"
      :disabled="buttonsDisabled"
      @click="refundAndRemovePayment"
    >
      Refund & Remove
    </button>
    <button
      class="border py-1 px-4 rounded-md bg-violet-600 hover:bg-violet-800 active:bg-violet-900 disabled:bg-violet-300"
      :disabled="buttonsDisabled"
      @click="justRemovePaymentFromBill"
    >
      Remove
    </button>
    <button
      class="border py-1 px-4 rounded-md bg-violet-600 hover:bg-violet-800 active:bg-violet-900 disabled:bg-violet-300"
      :disabled="buttonsDisabled"
      @click="
        () => {
          close();
        }
      "
    >
      Cancel
    </button>
  </div>
</template>
