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
import { MagnifyingGlassIcon, PencilSquareIcon } from "@heroicons/vue/24/solid";
import { BookOpenIcon } from "@heroicons/vue/24/outline";
import { setRoute } from "@/utils/routeHelpers";
import { getStudentCount } from "@/apiConnections/analytics";
import type { Grade } from "@/types/gradeTypes";
import type { Student } from "@/types/studentTypes";
import { useExtendablePopUpStore } from "@/stores/formManagers/extendablePopUp";
import FingerprintRegister from "@/components/dataSelectors/FingerprintRegister.vue";

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
        ];
        studentDataForTable.value.push(row);
    });
}

let gradeData: Grade[] = [];

async function init() {
    loadStudents(0);
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
        <div class="flex justify-between items-center mb-10 mt-10">
            <h4 class="font-semibold text-3xl">Students</h4>
            <NewItemButton text="New Student" :on-click="addNewStudent" />
        </div>
        <div class="mb-16 flex border-b border-slate-300 text-lg justify-evenly">
            <p>
                Total -
                {{ studentCountAnalytics.active ? studentCountAnalytics.active + studentCountAnalytics.inactive! : "" }}
            </p>
            <p>Active - {{ studentCountAnalytics.active ? studentCountAnalytics.active : "" }}</p>
            <p>Inactive - {{ studentCountAnalytics.inactive ? studentCountAnalytics.inactive : "" }}</p>
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
    <!-- <div class="fixed w-full h-full" v-show="showFingerprintRegister">
        <FingerprintRegister />
    </div> -->
</template>
