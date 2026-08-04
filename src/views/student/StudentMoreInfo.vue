<script setup lang="ts">
import {
  downloadStudentImage,
  getAdmissionPaymentStatus,
  getStudentById,
  markAdmissionFee,
  updateAdmissionFee,
  updateStudentImage,
  updateStudent,
  updateStudentFields
} from "@/apiConnections/students";
import BillEnroller from "@/components/BillEnroller.vue";
import RfidRegister from "@/components/dataSelectors/RfidRegister.vue";
import FingerprintRegister from "@/components/dataSelectors/FingerprintRegister.vue";
import { useAlertsStore } from "@/stores/alerts";
import { useDataEntryFormsStore } from "@/stores/formManagers/dataEntryForm";
import { useExtendablePopUpStore } from "@/stores/formManagers/extendablePopUp";
import type { AdmissionFee, Student } from "@/types/studentTypes";
import { getRouterParam, setRoute } from "@/utils/routeHelpers";
import { ref, watch, type Ref } from "vue";
import { useRoute } from "vue-router";

const alertStore = useAlertsStore();
const dataEntryForm = useDataEntryFormsStore();
const extendablePopUpStore = useExtendablePopUpStore();

const imageUrl: Ref<null | string> = ref(null);

const studentId = getRouterParam("id");
let student: Ref<Student | null> = ref(null);
const admissionPayment: Ref<AdmissionFee | null> = ref(null);

const showBillEnroller = ref(false);
const billEnrollerStudentId = ref(Number(studentId));
const billEnrollerAdmissionPaid = ref(false);

const route = useRoute();
watch(() => route.params.id, (newId) => {
    if (newId) {
        student.value = null;
        admissionPayment.value = null;
        imageUrl.value = null;
        loadStudent(Number(newId));
        loadAdmissionPayment(Number(newId));
        loadImage(Number(newId));
        billEnrollerStudentId.value = Number(newId);
    }
});

loadStudent(Number(studentId));
loadAdmissionPayment(Number(studentId));
loadImage(Number(studentId));

async function loadAdmissionPayment(studentId: number) {
  let resp = await getAdmissionPaymentStatus(studentId);
  if (resp.status === "error") {
    alertStore.insertAlert("An error occured.", resp.message, "error");
    return;
  }

  let payments: AdmissionFee[] = resp.data.admission_fees;
  if (payments.length > 0) {
    admissionPayment.value = payments[0];
  }
}

async function payAdmission(update: boolean) {
  let amount = null;
  if (admissionPayment.value) amount = admissionPayment.value.amount;
  let paid = update ? admissionPayment.value?.paid : undefined;
  let reduction = update ? admissionPayment.value?.reductions : null;

  dataEntryForm.newDataEntryForm("Admission Fee", "Mark", [
    { name: "amount", type: "number", min: 0, required: true, text: "Amount", value: amount },
    {
      name: "paid",
      type: "select",
      required: true,
      text: "Paid",
      value: paid,
      options: [
        { value: true, text: "Yes" },
        { value: false, text: "No" },
      ],
    },
    { type: "message", text: "If any discounts were applied, enter the reason here." },
    { name: "reduction_reason", type: "text", text: "Reason for reduction", value: reduction },
  ]);
  let results = await dataEntryForm.waitForSubmittedData();
  if (!results.submitted) return;

  let resp = undefined;
  if (update)
    resp = await updateAdmissionFee(
      admissionPayment.value?.id!,
      results.data.amount as number,
      results.data.paid as boolean,
      results.data.reduction_reason as string
    );
  else
    resp = await markAdmissionFee(
      student.value?.id!,
      results.data.amount as number,
      results.data.paid as boolean,
      results.data.reduction_reason as string
    );

  if (resp.status === "error") {
    alertStore.insertAlert("An error occured.", resp.message, "error");
    return;
  }
  dataEntryForm.finishSubmission();
  alertStore.insertAlert("Success", "Admission fee payment marked successfully.", "success");
  loadAdmissionPayment(student.value?.id!);

  if (results.data.paid) {
    billEnrollerAdmissionPaid.value = true;
    showBillEnroller.value = true;
  }
}

async function loadStudent(studentID: number) {
  let resp = await getStudentById(studentID);
  if (resp.status === "error") {
    alertStore.insertAlert("An error occured.", resp.message, "error");
    return;
  }

  student.value = resp.data.student;
}

async function loadImage(studentId: number) {
  let resp = await downloadStudentImage(studentId);
  if (resp.status === "error") {
    imageUrl.value = "/default-profile.png";
    return;
  }

  imageUrl.value = URL.createObjectURL(resp.data.file);
}

async function uploadStudentImage(studentId: number) {
  dataEntryForm.newDataEntryForm("Student's Image", "Upload", [
    { name: "profile", text: "Select Image", type: "file", accept: ".jpg,.jpeg,.png", preview: true, required: true },
  ]);
  let results = await dataEntryForm.waitForSubmittedData();
  if (!results.submitted) return;

  let img: any = results.data.profile;
  let res = await updateStudentImage(studentId, img[0]);
  if (res.status === "error") {
    if (res.data.type === "user_error")
      Object.entries(res.data.messages).forEach((msg) => {
        let err = "";
        if (Array.isArray(msg[1]) && !msg[1] === null) err = msg[1].join(", ");
        else err = msg[1] as string;
        dataEntryForm.insertErrorMessage(msg[0], err);
      });
    else alertStore.insertAlert("An error occurred.", res.message, "error");
    dataEntryForm.finishSubmission();
    return;
  }
  dataEntryForm.finishSubmission();
  loadImage(studentId);
  alertStore.insertAlert("Action completed.", "Student photo updated successfully.");
}

function showFingerprintReg() {
  extendablePopUpStore.showComponent(FingerprintRegister, studentId);
}

function updateRfid() {
  extendablePopUpStore.showComponent(RfidRegister, studentId);
}

async function updatePaymentOverrideWeek() {
  dataEntryForm.newDataEntryForm("Payment Override Week", "Update", [
    { type: "message", text: "This setting will reset to the default value after 4 months." },
    { 
      name: "payment_override_week", 
      type: "number", 
      min: 1, 
      max: 5, 
      text: "Override Week (1-5, leave blank to reset)", 
      value: student.value?.payment_override_week,
      required: false
    },
  ]);
  
  let results = await dataEntryForm.waitForSubmittedData();
  if (!results.submitted) return;

  let val: any = results.data.payment_override_week;
  if (val === "") val = null;

  let res = await updateStudentFields(student.value?.id!, { payment_override_week: val });
  if (res.status === "error") {
    if (res.data.type === "user_error") {
      Object.entries(res.data.messages).forEach((msg) => {
        let err = "";
        if (Array.isArray(msg[1]) && !msg[1] === null) err = msg[1].join(", ");
        else err = msg[1] as string;
        dataEntryForm.insertErrorMessage(msg[0], err);
      });
    } else {
      alertStore.insertAlert("An error occurred.", res.message, "error");
    }
    dataEntryForm.finishSubmission();
    return;
  }
  
  dataEntryForm.finishSubmission();
  loadStudent(student.value?.id!);
  alertStore.insertAlert("Success", "Payment override updated successfully.");
}
</script>

<template>
  <div class="bg-slate-200 w-full p-5">
    <div class="container flex gap-x-6 items-start">
      <div class="flex flex-col flex-1 gap-y-5">
        <div class="grid grid-cols-3 gap-4 p-5 rounded-xl w-full bg-white">
          <div class="flex flex-col items-center">
            <div v-if="imageUrl === null" class="flex items-center justify-center ml-3">
              <div
                class="animate-pulse bg-gray-400 w-[200px] lg:w-[300px] h-[200px] lg:h-[300px] rounded-lg flex items-center justify-center"
              >
                <h4 class="text-2xl text-white">Loading</h4>
              </div>
            </div>
            <div v-else class="w-[300px] h-[300px] ml-3 flex items-center">
              <img :src="imageUrl" alt="student image" class="h-full w-full object-contain" />
            </div>
            <button
              @click="
                () => {
                  uploadStudentImage(student!.id);
                }
              "
              class="border py-2 px-5 rounded-lg font-semibold mt-5"
            >
              Update Image
            </button>
          </div>
          <div v-if="student === null" class="flex items-center justify-center col-span-2">
            <p>Loading</p>
          </div>
          <div v-else class="p-3 col-span-2 ml-5">
            <div class="grid grid-cols-3 items-center">
              <h4>ID</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.id }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Student ID</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.custom_id ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Name</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.name ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Full Name</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.full_name ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Email</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.email ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Phone Number</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.phone_number ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Birthday</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.birthday ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Grade</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.grade ? student.grade.name : "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Address</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.address ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>School</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.school ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Parent's Name</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.parent_name ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Parent's Phone Number</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.parent_phone_number ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Registered Date</h4>
              <p class="col-span-2 border-b border-slate-300">
                {{ student.created_at ? new Date(student.created_at).toLocaleString() : "None" }}
              </p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Admission Fee</h4>
              <div v-if="admissionPayment?.paid" class="border bg-green-200 text-green-800 text-center">Paid</div>
              <div v-else class="flex items-center">
                <p class="border bg-red-200 text-red-800 text-center h-fit w-fit py-1 px-5">Not Paid</p>
                <button
                  class="border bg-blue-500 py-2 px-5 rounded-md ml-5"
                  @click="
                    () => {
                      payAdmission(admissionPayment !== null);
                    }
                  "
                >
                  Pay
                </button>
              </div>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Fingerprint Status</h4>
              <div v-if="student.fingerprint" class="border bg-green-200 text-green-800 text-center">Added</div>
              <div v-else class="border bg-red-200 text-red-800 text-center">Not Added</div>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>RFID Code</h4>
              <p class="col-span-2 border-b border-slate-300">{{ student.rfid ?? "None" }}</p>
            </div>
            <div class="grid grid-cols-3 mt-3 items-center">
              <h4>Payment Deadline Override</h4>
              <p class="col-span-2 border-b border-slate-300">
                <span v-if="student.payment_override_week">
                  Week {{ student.payment_override_week }} (Expires: {{ student.payment_override_expires_at ? new Date(student.payment_override_expires_at).toLocaleDateString() : 'Never' }})
                </span>
                <span v-else>None</span>
              </p>
            </div>
          </div>
        </div>

        <div v-if="student !== null" class="p-5 rounded-xl bg-white shadow-sm border border-slate-200">
          <h3 class="text-lg font-bold border-b pb-2 mb-4 text-slate-800">Payment Habits & Trustworthiness</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold text-slate-700">Trustworthiness Score</span>
                <span
                  class="px-3 py-1 rounded-full font-bold text-sm"
                  :class="[
                    (student.trust_score ?? 100) >= 80 ? 'bg-green-200 text-green-800' :
                    (student.trust_score ?? 100) >= 50 ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
                  ]"
                >
                  {{ student.trust_score ?? 100 }}%
                </span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="[
                    (student.trust_score ?? 100) >= 80 ? 'bg-green-500' :
                    (student.trust_score ?? 100) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  ]"
                  :style="{ width: `${student.trust_score ?? 100}%` }"
                ></div>
              </div>
              <p class="text-xs text-slate-500 mt-2">
                Computed based on attendance records versus monthly payment compliance.
              </p>
            </div>
            <div>
              <h4 class="font-semibold text-slate-700 mb-2">Payment Week Tendency</h4>
              <div v-if="student.payment_week_tendency" class="space-y-2">
                <p class="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  ⚡ Primary: {{ student.payment_week_tendency.primary_week }}
                </p>
                <div class="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div class="bg-slate-50 p-2 rounded border border-slate-200">Week 1 (1-7): <span class="font-bold text-slate-700">{{ student.payment_week_tendency.week_1 }}%</span></div>
                  <div class="bg-slate-50 p-2 rounded border border-slate-200">Week 2 (8-14): <span class="font-bold text-slate-700">{{ student.payment_week_tendency.week_2 }}%</span></div>
                  <div class="bg-slate-50 p-2 rounded border border-slate-200">Week 3 (15-21): <span class="font-bold text-slate-700">{{ student.payment_week_tendency.week_3 }}%</span></div>
                  <div class="bg-slate-50 p-2 rounded border border-slate-200">Week 4 (22+): <span class="font-bold text-slate-700">{{ student.payment_week_tendency.week_4 }}%</span></div>
                </div>
              </div>
              <div v-else class="text-sm text-slate-500 italic">No payment history available.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl w-full max-w-[300px] p-5 flex flex-col items-center h-fit">
        <h2 class="text-xl font-semibold mb-10">Actions</h2>

        <button
          class="border bg-blue-500 py-2 px-5 rounded-md mb-3 w-full font-medium text-white shadow-sm hover:bg-blue-600 transition-colors"
          @click="
            () => {
              setRoute(`/enrollments?s_id=${student?.id}`);
            }
          "
        >
          Enrolled Courses
        </button>
        <button
          class="border bg-blue-500 py-2 px-5 rounded-md mb-3 w-full font-medium text-white shadow-sm hover:bg-blue-600 transition-colors"
          @click="
            () => {
              setRoute(`/payments/students?s_id=${student?.id}`);
            }
          "
        >
          Payments
        </button>
        <button
          class="border bg-blue-500 py-2 px-5 rounded-md mb-3 w-full font-medium text-white shadow-sm hover:bg-blue-600 transition-colors"
          @click="
            () => {
              showFingerprintReg();
            }
          "
        >
          Update Fingerprint
        </button>
        <button
          class="border bg-blue-500 py-2 px-5 rounded-md mb-3 w-full font-medium text-white shadow-sm hover:bg-blue-600 transition-colors"
          @click="updateRfid"
        >
          Update RFID
        </button>
        <button
          class="border bg-blue-500 py-2 px-5 rounded-md mb-3 w-full font-medium text-white shadow-sm hover:bg-blue-600 transition-colors"
          @click="updatePaymentOverrideWeek"
        >
          Payment Override
        </button>
      </div>
    </div>
  </div>
  <BillEnroller
    :show="showBillEnroller"
    :student-id="billEnrollerStudentId"
    :admission-paid="billEnrollerAdmissionPaid"
    @close="showBillEnroller = false"
  />
</template>
