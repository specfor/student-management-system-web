<script setup lang="ts">
import { ref, type Ref } from "vue";
import PopUpPlaceholder from "./popUpPlaceholder.vue";
import { watch } from "vue";
import BillCard from "./rightMenu/BillCard.vue";
import type { StudentPaymentBill } from "@/types/billTypes";
import { createBill, getBills } from "@/apiConnections/billPrint";
import { useAlertsStore } from "@/stores/alerts";
import { useglobalDataStore } from "@/stores/globalData";

const alertStore = useAlertsStore();
const globalDataStore = useglobalDataStore();

const StudentBills: Ref<StudentPaymentBill[]> = ref([]);
const selectedBillId = ref(-1);
const bills: Ref<StudentPaymentBill[]> = ref([]);
const disableSelectBtn = ref(true);

const props = defineProps<{
  show: boolean;
  studentId: number;
  paymentId?: number;
  admissionPaid?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  billCreated: [billId: number];
}>();

watch(props, (propNew) => {
  disableSelectBtn.value = true;

  if (propNew.show) {
    selectedBillId.value = -1;
  }
  StudentBills.value = bills.value.filter((b) => b.student_id == propNew.studentId);
  if (StudentBills.value.length != 0) selectedBillId.value = StudentBills.value[0].id;
  disableSelectBtn.value = false;
});

watch(selectedBillId, (val) => {
  if (val != -1) disableSelectBtn.value = false;
});

async function loadBills() {
  let resp = await getBills(0, 100, {
    filters: {
      status: "pending",
    },
    sort: { by: "id", direction: "desc" },
  });
  if (resp.status == "success") {
    bills.value = resp.data.bills;
  }
}
loadBills();

async function selectBill(createNew: boolean) {
  disableSelectBtn.value = true;

  let resp;
  if (createNew)
    resp = await createBill(
      props.studentId,
      props.paymentId ? [props.paymentId] : undefined,
      props.admissionPaid ?? false,
      -1
    );
  else
    resp = await createBill(
      props.studentId,
      props.paymentId ? [props.paymentId] : undefined,
      props.admissionPaid ?? false,
      selectedBillId.value
    );

  if (resp.status == "success") {
    alertStore.insertAlert("Receipt Created.", "");
    loadBills();
    const billRefresher = globalDataStore.getHook("refresh-receipt-list");

    if (billRefresher) billRefresher();

    emit("close");
    emit("billCreated", resp.data.bill.id);
  } else {
    alertStore.insertAlert("Error Creating a Receipt", resp.message, "error");
  }

  disableSelectBtn.value = false;
}

function skipReceipt() {
  emit("close");
}
</script>

<template>
  <PopUpPlaceholder :show="props.show">
    <div class="w-[500px] h-full">
      <p class="text-lg font-semibold my-3 text-center">Assign a Receipt</p>

      <p class="ml-4 mt-8">Select a receipt to insert the current payment.</p>
      <div class="mx-2 my-4 px-2 border border-gray-400 rounded-md">
        <div class="px-3 py-3 max-h-[300px] overflow-y-scroll">
          <div v-show="StudentBills.length == 0" class="border-2 border-lime-600 py-8 text-center rounded-lg">
            <p class="">No pending receipts for this student.</p>
            <p class="font-semibold text-lg">Creating a New Receipt</p>
          </div>

          <BillCard
            v-for="bill in StudentBills"
            :key="bill.id"
            :bill-id="bill.id"
            :bill-value="bill.total"
            :status="bill.status"
            :student-custom-id="bill.student_custom_id"
            :stduent-name="bill.student_name"
            :hide-buttons="true"
            class="cursor-pointer my-3"
            :class="selectedBillId == bill.id ? 'border-2 border-lime-600' : 'border-none'"
            @click="selectedBillId = bill.id"
          />
        </div>
      </div>

      <div class="flex justify-end gap-x-4 px-5 py-4 bg-slate-200">
        <button
          @click="skipReceipt"
          class="bg-blue-600 text-white font-bold px-3 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300"
        >
          Skip Receipt
        </button>
        <button
          @click="
            () => {
              selectBill(true);
            }
          "
          :disabled="disableSelectBtn"
          class="bg-blue-600 text-white font-bold px-3 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300"
        >
          New Bill
        </button>
        <button
          @click="
            () => {
              selectBill(false);
            }
          "
          :disabled="disableSelectBtn"
          class="bg-blue-600 text-white font-bold px-3 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300"
        >
          Select
        </button>
      </div>
    </div>
  </PopUpPlaceholder>
</template>
