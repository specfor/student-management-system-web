<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getGrades } from "@/apiConnections/grades";
import {
  createStudent,
  deleteStudent,
  getStudents,
  markAdmissionFee,
  updateStudent,
  updateStudentImage,
} from "@/apiConnections/students";
import NewItemButton from "@/components/minorUiComponents/NewItemButton.vue";
import TableComponent, {
  type Filter,
  type TableActionType,
  type TableColumns,
  type tableRowItem,
} from "@/components/TableComponent.vue";
import { useAlertsStore } from "@/stores/alerts";
import { useConfirmationFormsStore } from "@/stores/formManagers/confirmationForm";
import { useDataEntryFormsStore } from "@/stores/formManagers/dataEntryForm";
import { ref, type Ref } from "vue";
import {
  getTemporaryStudents,
  createTemporaryStudent,
  updateTemporaryStudent,
  deleteTemporaryStudent,
  convertTemporaryStudent,
} from "@/apiConnections/temporaryStudents";
import type { TemporaryStudent } from "@/types/studentTypes";
import TemporaryStudentReceiptModal from "@/components/TemporaryStudentReceiptModal.vue";
import { MagnifyingGlassIcon, PencilSquareIcon, PrinterIcon, UserPlusIcon } from "@heroicons/vue/24/solid";
import { BookOpenIcon } from "@heroicons/vue/24/outline";
import { setRoute } from "@/utils/routeHelpers";
import { getStudentCount } from "@/apiConnections/analytics";
import type { Grade } from "@/types/gradeTypes";
import type { Student } from "@/types/studentTypes";
import { useExtendablePopUpStore } from "@/stores/formManagers/extendablePopUp";
import FingerprintRegister from "@/components/dataSelectors/FingerprintRegister.vue";
import BillEnroller from "@/components/BillEnroller.vue";

const alertStore = useAlertsStore();
const dataEntryForm = useDataEntryFormsStore();
const confirmationForm = useConfirmationFormsStore();
const extendablePopUp = useExtendablePopUpStore();

let studentData: Student[] = [];
const studentDataForTable: Ref<any[]> = ref([]);
let gradeOptions: { value: number; text: string }[] = [];

const tableActions: TableActionType[] = [
  { renderAsRouterLink: false, type: "icon", emit: "ShowMore", icon: MagnifyingGlassIcon, css: "fill-blue-600 w-5" },
  { renderAsRouterLink: false, type: "icon", emit: "editEmit", icon: PencilSquareIcon, css: "fill-blue-600" },
  { renderAsRouterLink: false, type: "icon", emit: "coursesEmit", icon: BookOpenIcon, css: "stroke-blue-600" },
];
const tableColumns: TableColumns[] = [
  { label: "ID", sortable: true },
  { label: "Custom ID", sortable: true },
  { label: "Name", sortable: true },
  { label: "Grade", sortable: true },
  { label: "Email", sortable: true },
  { label: "School" },
  { label: "Admission Paid" },
  { label: "Trust Score", sortable: true },
];
const tableFilters: Filter[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "custom_id", label: "Custom Id", type: "text" },
  { name: "phone_number", type: "text", label: "Phone Number" },
  { name: "email", type: "text", label: "Email" },
  { name: "grade_id", label: "Grade", type: "select", options: gradeOptions },
  {
    name: "admission_paid",
    label: "Admission Paid",
    type: "select",
    options: [
      { text: "Paid", value: true },
      { text: "Not Paid", value: false },
    ],
  },
];

const activeTab = ref<"regular" | "temporary">("regular");

let tempStudentsData: TemporaryStudent[] = [];
const tempStudentsForTable: Ref<any[]> = ref([]);
const countTotTempStudents = ref(0);
const showTempReceiptModal = ref(false);
const selectedTempStudentIdForReceipt = ref(-1);

const tempTableActions: TableActionType[] = [
  { renderAsRouterLink: false, type: "icon", emit: "convertEmit", icon: UserPlusIcon, css: "fill-green-600 w-5" },
  { renderAsRouterLink: false, type: "icon", emit: "receiptEmit", icon: PrinterIcon, css: "fill-blue-600 w-5" },
  { renderAsRouterLink: false, type: "icon", emit: "editEmit", icon: PencilSquareIcon, css: "fill-amber-600 w-5" },
];

const tempTableColumns: TableColumns[] = [
  { label: "ID", sortable: true },
  { label: "Temp ID", sortable: true },
  { label: "Name", sortable: true },
  { label: "Grade" },
  { label: "Phone Number" },
  { label: "Fee (LKR)" },
  { label: "Fee Paid" },
  { label: "Notes" },
];

const tempTableFilters: Filter[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "phone_number", type: "text", label: "Phone Number" },
  { name: "grade_id", label: "Grade", type: "select", options: gradeOptions },
  {
    name: "fee_paid",
    label: "Fee Paid",
    type: "select",
    options: [
      { text: "Paid", value: true },
      { text: "Not Paid", value: false },
    ],
  },
];

let lastTempLoadSettings: {
  lastUsedIndex: number;
  orderBy: "id" | "name" | "created_at" | "grade_id";
  orderDirec: "asc" | "desc";
  filters?: {
    name?: string;
    phone_number?: string;
    grade_id?: number;
    fee_paid?: boolean;
  };
} = { lastUsedIndex: 0, orderBy: "id", orderDirec: "desc" };

function setTempSorting(column: string, direction: "asc" | "desc") {
  lastTempLoadSettings.orderDirec = direction;
  switch (column) {
    case "Temp ID":
      lastTempLoadSettings.orderBy = "id";
      break;
    case "Name":
      lastTempLoadSettings.orderBy = "name";
      break;
    default:
      lastTempLoadSettings.orderBy = "id";
      break;
  }
}

const showBillEnroller = ref(false);
const billEnrollerStudentId = ref(-1);
const billEnrollerAdmissionPaid = ref(false);

const limitLoadStudents = 30;
const countTotStudents = ref(0);

const studentCountAnalytics: Ref<{ active: number | null; inactive: number | null }> = ref({
  active: null,
  inactive: null,
});

let lastLoadSettings: {
  lastUsedIndex: number;
  orderBy: string;
  orderDirec: "asc" | "desc";
  filters?: {
    name?: string;
    grade_id?: number;
    custom_id?: number;
    admission_paid?: boolean;
    email?: string;
    phone_number?: string;
  };
} = { lastUsedIndex: 0, orderBy: "custom_id", orderDirec: "desc" };

function setSorting(column: string, direction: "asc" | "desc") {
  switch (column) {
    case "ID":
      lastLoadSettings.orderBy = "id";
      break;
    case "Custom ID":
      lastLoadSettings.orderBy = "custom_id";
      break;
    case "Name":
      lastLoadSettings.orderBy = "name";
      break;

    case "Grade":
      lastLoadSettings.orderBy = "grade_id";
      break;
    case "Email":
      lastLoadSettings.orderBy = "email";
      break;
    case "Birthday":
      lastLoadSettings.orderBy = "birthday";
      break;
    case "Trust Score":
      lastLoadSettings.orderBy = "trust_score";
      break;
    default:
      break;
  }
  lastLoadSettings.orderDirec = direction;
}

async function loadStudents(startIndex?: number, filters?: any) {
  if (startIndex === undefined) startIndex = lastLoadSettings.lastUsedIndex;
  else lastLoadSettings.lastUsedIndex = startIndex;

  if (filters) lastLoadSettings.filters = filters;

  let opt: any = {};
  opt.sort = { by: lastLoadSettings.orderBy, direction: lastLoadSettings.orderDirec };
  opt.filters = lastLoadSettings.filters;

  let resp = await getStudents(startIndex, limitLoadStudents, opt);
  if (resp.status === "error") {
    alertStore.insertAlert("An error occured.", resp.message, "error");
    return;
  }

  studentData = resp.data.students;
  countTotStudents.value = resp.data.tot_count;
  studentDataForTable.value = [];
  studentData.forEach((student) => {
    let score = student.trust_score !== undefined && student.trust_score !== null ? student.trust_score : 100;
    let scoreCss = "text-green-800 bg-green-200";
    if (score < 50) {
      scoreCss = "text-red-800 bg-red-200";
    } else if (score < 80) {
      scoreCss = "text-amber-800 bg-amber-200";
    }

    let row: tableRowItem[] = [
      student.id,
      student.custom_id,
      student.name,
      student.grade ? student.grade.name : "DELETED GRADE",
      student.email,
      student.school,
      student.admission_paid
        ? { type: "colorTag", text: "Paid", css: "text-green-800 bg-green-200" }
        : { type: "colorTag", text: "Not Paid", css: "text-red-800 bg-red-200" },
      { type: "colorTag", text: `${score}%`, css: scoreCss },
    ];
    studentDataForTable.value.push(row);
  });
}

function cleanTempId(id: number | string): number {
  if (typeof id === "string" && /^(?:TEMP|REG)-/i.test(id)) {
    return parseInt(id.replace(/^(?:TEMP|REG)-/i, ""), 10);
  }
  return Number(id);
}

async function loadTemporaryStudents(
  start?: number,
  filters?: {
    name?: string;
    phone_number?: string;
    grade_id?: number;
    fee_paid?: boolean;
  }
) {
  if (start !== undefined) lastTempLoadSettings.lastUsedIndex = start;
  if (filters !== undefined) lastTempLoadSettings.filters = filters;

  const resp = await getTemporaryStudents(lastTempLoadSettings.lastUsedIndex, limitLoadStudents, {
    filters: lastTempLoadSettings.filters,
    sort: { by: lastTempLoadSettings.orderBy, direction: lastTempLoadSettings.orderDirec },
  });

  if (resp.status === "error") {
    alertStore.insertAlert("An error occurred.", resp.message, "error");
    return;
  }

  tempStudentsData = resp.data.temporary_students;
  countTotTempStudents.value = resp.data.tot_count;
  tempStudentsForTable.value = [];

  tempStudentsData.forEach((ts) => {
    const row: tableRowItem[] = [
      ts.id,
      `TEMP-${String(ts.id).padStart(4, "0")}`,
      ts.name,
      ts.grade ? ts.grade.name : "N/A",
      ts.phone_number || "N/A",
      Number(ts.registration_fee).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ts.fee_paid
        ? { type: "colorTag", text: "Paid", css: "text-green-800 bg-green-200" }
        : { type: "colorTag", text: "Not Paid", css: "text-red-800 bg-red-200" },
      ts.notes ? (ts.notes.length > 30 ? ts.notes.substring(0, 30) + "..." : ts.notes) : "-",
    ];
    tempStudentsForTable.value.push(row);
  });
}

let gradeData: Grade[] = [];

async function init() {
  loadStudents(0);
  loadTemporaryStudents(0);
  let resp = await getGrades();
  if (resp.status === "success") {
    gradeData = resp.data.grades;
  }
  gradeData.forEach((grade) => {
    gradeOptions.push({ value: grade.id, text: grade.name });
  });
}
init();

async function loadStudentCount() {
  let resp = await getStudentCount();
  if (resp.status === "success") {
    studentCountAnalytics.value.active = resp.data.active;
    studentCountAnalytics.value.inactive = resp.data.inactive;
  }
}
loadStudentCount();

async function addNewTemporaryStudent() {
  dataEntryForm.newDataEntryForm("New Temporary Registration", "Register", [
    { name: "name", text: "Student Name", type: "text", required: true },
    { name: "grade_id", text: "Select Grade", type: "select", required: true, options: gradeOptions },
    { name: "phone_number", text: "Phone Number", type: "text" },
    { name: "registration_fee", text: "Registration Fee (LKR)", type: "number", min: 0, required: true, value: 0 },
    {
      name: "fee_paid",
      text: "Fee Paid",
      type: "select",
      required: true,
      value: true,
      options: [
        { text: "Yes", value: true },
        { text: "No", value: false },
      ],
    },
    { name: "notes", text: "Quick Notes / Comments", type: "textarea" },
  ]);

  let results = await dataEntryForm.waitForSubmittedData();
  if (!results.submitted) return;

  const resp = await createTemporaryStudent(
    results.data.name as string,
    results.data.grade_id as number,
    results.data.phone_number as string,
    results.data.registration_fee as number,
    Boolean(results.data.fee_paid),
    results.data.notes as string
  );

  if (resp.status === "error") {
    if (resp.data?.type === "user_error" && resp.data.messages) {
      Object.entries(resp.data.messages).forEach(([field, msgs]) => {
        let err = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
        dataEntryForm.insertErrorMessage(field, err);
      });
    } else {
      alertStore.insertAlert("An error occurred.", resp.message, "error");
    }
    return;
  }

  dataEntryForm.finishSubmission();
  alertStore.insertAlert("Success", "Temporary registration created successfully.");
  await loadTemporaryStudents(0);

  let conf = await confirmationForm.newConfirmationForm(
    "Issue Registration Receipt?",
    `Do you want to issue/print the receipt for ${resp.data.temporary_student.name}?`
  );
  if (conf) {
    showTempReceipt(resp.data.temporary_student.id);
  }
}

async function editTemporaryStudent(rawId: number | string) {
  const id = cleanTempId(rawId);
  let ts = tempStudentsData.find((t) => t.id === id);
  if (!ts) return;

  dataEntryForm.newDataEntryForm("Update Temporary Registration", "Update", [
    { name: "id", text: "Temp ID", type: "text", disabled: true, value: `TEMP-${String(ts.id).padStart(4, "0")}` },
    { name: "name", text: "Student Name", type: "text", required: true, value: ts.name },
    { name: "grade_id", text: "Select Grade", type: "select", required: true, value: ts.grade_id || "", options: gradeOptions },
    { name: "phone_number", text: "Phone Number", type: "text", value: ts.phone_number || "" },
    { name: "registration_fee", text: "Registration Fee (LKR)", type: "number", min: 0, required: true, value: ts.registration_fee },
    {
      name: "fee_paid",
      text: "Fee Paid",
      type: "select",
      required: true,
      value: ts.fee_paid,
      options: [
        { text: "Yes", value: true },
        { text: "No", value: false },
      ],
    },
    { name: "notes", text: "Quick Notes / Comments", type: "textarea", value: ts.notes || "" },
  ]);

  let results = await dataEntryForm.waitForSubmittedData();
  if (!results.submitted) return;

  const resp = await updateTemporaryStudent(id, {
    name: results.data.name as string,
    grade_id: results.data.grade_id as number,
    phone_number: results.data.phone_number as string,
    registration_fee: results.data.registration_fee as number,
    fee_paid: Boolean(results.data.fee_paid),
    notes: results.data.notes as string,
  });

  if (resp.status === "error") {
    alertStore.insertAlert("An error occurred.", resp.message, "error");
    return;
  }

  dataEntryForm.finishSubmission();
  alertStore.insertAlert("Success", "Temporary registration updated successfully.");
  loadTemporaryStudents();
}

async function delTemporaryStudent(ids: (number | string)[]) {
  if (ids.length === 0) return;
  let id = cleanTempId(ids[0]);
  let ts = tempStudentsData.find((t) => t.id === id);
  if (!ts) return;

  let conf = await confirmationForm.newConfirmationForm(
    "Delete Temporary Registration?",
    `Are you sure you want to delete ${ts.name}? This action cannot be undone.`
  );
  if (!conf) return;

  const resp = await deleteTemporaryStudent(id);
  if (resp.status === "error") {
    alertStore.insertAlert("An error occurred.", resp.message, "error");
    return;
  }

  alertStore.insertAlert("Deleted", "Temporary student deleted successfully.");
  loadTemporaryStudents();
}

async function convertTempStudent(rawId: number | string) {
  const id = cleanTempId(rawId);
  let ts = tempStudentsData.find((t) => t.id === id);
  if (!ts) return;

  dataEntryForm.newDataEntryForm("Convert to Regular Student", "Convert", [
    { type: "message", text: `Converting temporary registration "${ts.name}" to a regular student profile. Enter the 5-character custom ID and optional full details.` },
    {
      name: "custom_id",
      text: "Student ID (5 chars)",
      type: "text",
      required: true,
      validate: (val) => {
        let strVal = String(val);
        if (strVal.length !== 5) return "Student ID must be exactly 5 characters long.";
        else return null;
      },
    },
    { name: "name", text: "Name", type: "text", required: true, value: ts.name },
    { name: "full_name", text: "Full Name", type: "text" },
    { name: "grade_id", text: "Select Grade", type: "select", required: true, value: ts.grade_id || "", options: gradeOptions },
    { name: "phone_number", text: "Phone Number", type: "text", value: ts.phone_number || "" },
    { name: "email", text: "Email", type: "text" },
    { name: "birthday", text: "Birth Date", type: "date" },
    { name: "school", text: "School", type: "text" },
    { name: "parent_name", text: "Parent Name", type: "text" },
    { name: "parent_phone_number", text: "Parent's Phone Number", type: "text" },
  ]);

  let results = await dataEntryForm.waitForSubmittedData();
  if (!results.submitted) return;

  const resp = await convertTemporaryStudent(id, {
    custom_id: results.data.custom_id as string,
    name: results.data.name as string,
    full_name: results.data.full_name as string,
    grade_id: results.data.grade_id as number,
    phone_number: results.data.phone_number as string,
    email: results.data.email as string,
    birthday: results.data.birthday as string,
    school: results.data.school as string,
    parent_name: results.data.parent_name as string,
    parent_phone_number: results.data.parent_phone_number as string,
  });

  if (resp.status === "error") {
    if (resp.data?.type === "user_error" && resp.data.messages) {
      Object.entries(resp.data.messages).forEach(([field, msgs]) => {
        let err = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
        dataEntryForm.insertErrorMessage(field, err);
      });
    } else {
      alertStore.insertAlert("An error occurred.", resp.message, "error");
    }
    return;
  }

  dataEntryForm.finishSubmission();
  alertStore.insertAlert("Converted!", `${ts.name} has been converted into a regular student.`);
  loadTemporaryStudents();
  loadStudents(0);
  loadStudentCount();
}

function showTempReceipt(id: number | string) {
  selectedTempStudentIdForReceipt.value = cleanTempId(id);
  showTempReceiptModal.value = true;
}

async function addNewStudent() {
  dataEntryForm.newDataEntryForm("New Student", "Create", [
    {
      name: "custom_id",
      text: "Student ID",
      type: "text",
      required: true,
      validate: (val) => {
        let strVal = String(val);
        if (strVal.length !== 5) return "Student ID must be 5 characters long.";
        else return null;
      },
    },
    { name: "name", text: "Name", type: "text", required: true },
    { name: "full_name", text: "Full Name", type: "text" },
    { name: "grade_id", text: "Select Grade", type: "select", required: true, options: gradeOptions },
    { name: "email", text: "Email", type: "text" },
    { name: "birthday", text: "Birth Date", type: "date" },
    { name: "phone_number", text: "Phone Number", type: "text" },
    { name: "address", text: "Address", type: "textarea" },
    { name: "school", text: "School", type: "text" },
    { name: "parent_name", text: "Parent Name", type: "text" },
    { name: "parent_phone_number", text: "Parent's Phone Number", type: "text" },
  ]);

  let createdStudentId: null | number = null;

  while (true) {
    let results = await dataEntryForm.waitForSubmittedData();
    if (!results.submitted) return;

    let resp = await createStudent(
      results.data["custom_id"] as string,
      results.data["name"] as string,
      results.data["full_name"] as string,
      results.data["grade_id"] as number,
      results.data["email"] as string,
      results.data["birthday"] as string,
      results.data["phone_number"] as string,
      results.data["address"] as string,
      results.data["school"] as string,
      results.data["parent_name"] as string,
      results.data["parent_phone_number"] as string
    );
    if (resp.status === "error") {
      if (resp.data.type === "user_error")
        Object.entries(resp.data.messages).forEach((msg) => {
          let err = "";
          if (Array.isArray(msg[1]) && !msg[1] === null) err = msg[1].join(", ");
          else err = msg[1] as string;
          dataEntryForm.insertErrorMessage(msg[0], err);
        });
      else alertStore.insertAlert("An error occured.", resp.message, "error");
      continue;
    }
    createdStudentId = resp.data.student.id;
    dataEntryForm.finishSubmission();
    alertStore.insertAlert("Action completed.", "Student added successfully.");
    loadStudents(0);
    loadStudentCount();
    uploadStudentImage(resp.data.student.id);
    break;
  }

  dataEntryForm.newDataEntryForm("Admission Fee", "Mark", [
    { name: "amount", type: "number", min: 0, required: true, text: "Amount" },
    {
      name: "paid",
      type: "select",
      required: true,
      text: "Paid",
      value: false,
      options: [
        { value: true, text: "Yes" },
        { value: false, text: "No" },
      ],
    },
    { type: "message", text: "If any discounts were applied, enter the reason here." },
    { name: "reduction_reason", type: "text", text: "Reason for reduction" },
  ]);
  let results = await dataEntryForm.waitForSubmittedData();
  if (results.submitted) {
    let resp = await markAdmissionFee(
      createdStudentId!,
      results.data.amount as number,
      Boolean(results.data.paid),
      results.data.reduction_reason as string
    );
    if (resp.status === "error") {
      alertStore.insertAlert("An error occured.", resp.message, "error");
    } else {
      dataEntryForm.finishSubmission();
      loadStudents(0);
      alertStore.insertAlert("Action completed.", "Admission fee marked successfully.");

      if (results.data.paid) {
        billEnrollerStudentId.value = createdStudentId!;
        billEnrollerAdmissionPaid.value = true;
        showBillEnroller.value = true;

        await new Promise((resolve) => {
          setInterval(() => {
            if (showBillEnroller.value == false) resolve(true);
          }, 500);
        });
      }
    }
  }

  extendablePopUp.showComponent(FingerprintRegister, createdStudentId);
}

async function uploadStudentImage(studentId: number) {
  dataEntryForm.newDataEntryForm("Student's Image", "Upload", [
    { text: "You can update the image later also. Click 'close' to continue without image.", type: "message" },
    {
      name: "profile",
      text: "Select Image",
      type: "file",
      accept: ".jpg,.jpeg,.png",
      preview: true,
      required: true,
    },
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
  alertStore.insertAlert("Action completed.", "Student photo updated successfully.");
}

async function editStudent(id: number) {
  let student = studentData.find((s) => s.id === id)!;

  dataEntryForm.newDataEntryForm("Update Student", "Update", [
    { name: "id", text: "ID", type: "text", disabled: true, value: student.id },
    {
      name: "custom_id",
      text: "Student ID",
      type: "text",
      required: true,
      value: student.custom_id,
      validate: (val) => {
        let strVal = String(val);
        if (strVal.length !== 5) return "Student ID must be 5 characters long.";
        else return null;
      },
    },
    { name: "name", text: "Name", type: "text", required: true, value: student.name },
    { name: "full_name", text: "Full Name", type: "text", value: student.full_name },
    {
      name: "grade_id",
      text: "Select Grade",
      type: "select",
      required: true,
      value: student.grade ? student.grade.id : "",
      options: gradeOptions,
    },
    { name: "email", text: "Email", type: "text", value: student.email },
    { name: "birthday", text: "Birth Date", type: "date", value: student.birthday },
    { name: "phone_number", text: "Phone Number", type: "text", value: student.phone_number },
    { name: "address", text: "Address", type: "textarea", value: student.address },
    { name: "school", text: "School", type: "text", value: student.school },
    { name: "parent_name", text: "Parent Name", type: "text", value: student.parent_name },
    {
      name: "parent_phone_number",
      text: "Parent's Phone Number",
      type: "text",
      value: student.parent_phone_number,
    },
  ]);

  while (true) {
    let results = await dataEntryForm.waitForSubmittedData();
    if (!results.submitted) return;

    let resp = await updateStudent(
      results.data["id"] as number,
      results.data["custom_id"] as string,
      results.data["name"] as string,
      results.data["full_name"] as string,
      results.data["grade_id"] as number,
      results.data["email"] as string,
      results.data["birthday"] as string,
      results.data["phone_number"] as string,
      results.data["address"] as string,
      results.data["school"] as string,
      results.data["parent_name"] as string,
      results.data["parent_phone_number"] as string
    );
    if (resp.status === "error") {
      if (resp.data.type === "user_error")
        Object.entries(resp.data.messages).forEach((msg) => {
          let err = "";
          if (Array.isArray(msg[1]) && !msg[1] === null) err = msg[1].join(", ");
          else err = msg[1] as string;
          dataEntryForm.insertErrorMessage(msg[0], err);
        });
      else alertStore.insertAlert("An error occured.", resp.message, "error");
      continue;
    }
    alertStore.insertAlert("Action completed.", "Student updated successfully.");
    loadStudents();
    dataEntryForm.finishSubmission();
    break;
  }
}

async function delStudent(ids: number[]) {
  let confirmed = await confirmationForm.newConfirmationForm(
    "Confirm Deletion",
    "Are you sure you want to delete these students with IDs: " + ids.join(", ") + "?"
  );
  if (!confirmed) return;

  ids.forEach(async (id) => {
    let resp = await deleteStudent(id);
    if (resp.status === "error") {
      alertStore.insertAlert("An error occured deleting student.", resp.message, "error");
      return;
    }
    alertStore.insertAlert("Action completed.", resp.message);
  });
  loadStudents();
}

function showMoreInfo(id: number) {
  setRoute(`/students/${id}/view`);
}

function showStudentCourses(id: number) {
  setRoute(`/enrollments?s_id=${id}`);
}
</script>

<template>
  <div class="container">
    <div class="flex justify-between items-center mb-6 mt-10">
      <h4 class="font-semibold text-3xl">Students</h4>
      <NewItemButton
        :text="activeTab === 'regular' ? 'New Student' : 'New Temp Registration'"
        :on-click="activeTab === 'regular' ? addNewStudent : addNewTemporaryStudent"
      />
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-300 mb-8">
      <button
        @click="activeTab = 'regular'"
        :class="[
          'py-3 px-6 text-lg font-medium border-b-2 transition-colors duration-200 focus:outline-none -mb-[1px]',
          activeTab === 'regular'
            ? 'border-blue-600 text-blue-600 font-semibold'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        ]"
      >
        Regular Students
      </button>
      <button
        @click="activeTab = 'temporary'"
        :class="[
          'py-3 px-6 text-lg font-medium border-b-2 transition-colors duration-200 focus:outline-none -mb-[1px] flex items-center gap-2',
          activeTab === 'temporary'
            ? 'border-blue-600 text-blue-600 font-semibold'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        ]"
      >
        <span>Temporary Registrations</span>
        <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{{ countTotTempStudents }}</span>
      </button>
    </div>

    <!-- Regular Students Tab -->
    <div v-show="activeTab === 'regular'">
      <div class="mb-8 flex border-b border-slate-200 pb-4 text-lg justify-evenly text-slate-600">
        <p>
          Total -
          <span class="font-semibold text-slate-800">{{ studentCountAnalytics.active ? studentCountAnalytics.active + studentCountAnalytics.inactive! : "" }}</span>
        </p>
        <p>Active - <span class="font-semibold text-green-600">{{ studentCountAnalytics.active ? studentCountAnalytics.active : "" }}</span></p>
        <p>Inactive - <span class="font-semibold text-red-600">{{ studentCountAnalytics.inactive ? studentCountAnalytics.inactive : "" }}</span></p>
      </div>
      <div class="mb-10">
        <TableComponent
          :table-columns="tableColumns"
          :table-rows="studentDataForTable"
          :actions="tableActions"
          @edit-emit="editStudent"
          @show-more="showMoreInfo"
          :refresh-func="
            async () => {
              await loadStudents();
              return true;
            }
          "
          @delete-emit="delStudent"
          @courses-emit="showStudentCourses"
          @load-page-emit="loadStudents"
          :paginate-page-size="limitLoadStudents"
          :paginate-total="countTotStudents"
          @sort-by="
            (col: string, dir: 'asc' | 'desc') => {
              setSorting(col, dir);
              loadStudents();
            }
          "
          :current-sorting="{ column: 'Custom ID', direc: 'desc' }"
          :filters="tableFilters"
          @filter-values="
            (val: any) => {
              loadStudents(undefined, val);
            }
          "
        />
      </div>
    </div>

    <!-- Temporary Registrations Tab -->
    <div v-show="activeTab === 'temporary'">
      <div class="mb-10">
        <TableComponent
          :table-columns="tempTableColumns"
          :table-rows="tempStudentsForTable"
          :actions="tempTableActions"
          @convert-emit="convertTempStudent"
          @receipt-emit="showTempReceipt"
          @edit-emit="editTemporaryStudent"
          :refresh-func="
            async () => {
              await loadTemporaryStudents();
              return true;
            }
          "
          @delete-emit="delTemporaryStudent"
          @load-page-emit="loadTemporaryStudents"
          :paginate-page-size="limitLoadStudents"
          :paginate-total="countTotTempStudents"
          @sort-by="
            (col: string, dir: 'asc' | 'desc') => {
              setTempSorting(col, dir);
              loadTemporaryStudents();
            }
          "
          :current-sorting="{ column: 'Temp ID', direc: 'desc' }"
          :filters="tempTableFilters"
          @filter-values="
            (val: any) => {
              loadTemporaryStudents(undefined, val);
            }
          "
        />
      </div>
    </div>
  </div>
  <BillEnroller
    :show="showBillEnroller"
    :student-id="billEnrollerStudentId"
    :admission-paid="billEnrollerAdmissionPaid"
    @close="showBillEnroller = false"
  />
  <TemporaryStudentReceiptModal
    :show="showTempReceiptModal"
    :temporary-student-id="selectedTempStudentIdForReceipt"
    @close="showTempReceiptModal = false"
  />
</template>
