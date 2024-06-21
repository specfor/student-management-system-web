<script setup lang="ts">
import { ref, watch, type Ref } from 'vue';
import SelectionBox from '../primary/SelectionBox.vue';
import { downloadStudentImage, getStudents } from '@/apiConnections/students';

const selectedStudent = ref(0)
const selectedStudentData: Ref<Student | null> = ref(null)
const selectedStudentImageUrl = ref('/default-profile.png')
const studentOptionFields: Ref<{ text: string, value: any }[]> = ref([])

let students: Student[] = []

const emit = defineEmits<{
    student: [student: Student]
}>()

watch(selectedStudent, async (studentID) => {
    selectedStudentData.value = students.find(s => s.id == studentID)!
    emit('student', selectedStudentData.value)
    if (selectedStudentData.value.image) {
        let resp = await downloadStudentImage(studentID)
        if (resp.status === 'success')
            selectedStudentImageUrl.value = URL.createObjectURL(resp.data.file)
    }
    else
        selectedStudentImageUrl.value = '/default-profile.png'
})

async function loadStudents() {
    const resp = await getStudents()
    if (resp.status === 'error')
        return

    students = resp.data.students
    students.forEach(student => {
        studentOptionFields.value.push({ text: student.name, value: student.id })
    })
}
loadStudents()
</script>

<template>
    <div class="flex justify-between items-center">
        <div class="flex items-center mr-5">
            <h4 class="mr-5 font-semibold">Select a Student</h4>
            <SelectionBox :options="studentOptionFields" :value="selectedStudent"
                @input="(val) => { selectedStudent = val }" class="w-[300px] mr-5" />
        </div>
    </div>
    <div class="grid grid-cols-3 gap-x-10 border rounded-xl py-3 px-10 mt-4 text-slate-600">
        <div class="justify-self-center">
            <img :src="selectedStudentImageUrl" alt="student photo" class="object-cover w-[100px]">
        </div>
        <div class="col-span-2">
            <h1 class="font-semibold text-lg">Student Info</h1>
            <div class="grid grid-cols-2 ml-5">
                <h4>Student Id</h4>
                <h4>{{ selectedStudentData ? selectedStudentData.custom_id : '' }}</h4>
            </div>
            <div class="grid grid-cols-2 ml-5">
                <h4>Name</h4>
                <h4>{{ selectedStudentData ? selectedStudentData.name : '' }}</h4>
            </div>
            <div class="grid grid-cols-2 ml-5">
                <h4>Grade</h4>
                <h4>{{ selectedStudentData ? (selectedStudentData.grade ? selectedStudentData.grade.name :
                    '') : '' }}</h4>
            </div>
        </div>
    </div>
</template>