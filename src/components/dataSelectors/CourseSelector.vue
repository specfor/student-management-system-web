<script setup lang="ts">
import { defineEmits, ref, watch, type Ref } from 'vue';
import SelectionBox from '../primary/SelectionBox.vue';
import { getCourses } from '@/apiConnections/courses';

const selectedCourseData: Ref<Course | null> = ref(null)
const courseGroupOptionFields: Ref<{ text: string, value: any }[]> = ref([])
const selectedCourseGroup = ref('')
const coursesOptionFields: Ref<{ text: string, value: any }[]> = ref([])
const selectedCourseForTable = ref(0)

let courses: Course[] = [];

const emit = defineEmits<{
    course: [course: Course]
}>()

async function laodCourses() {
    let resp = await getCourses()
    if (resp.status === 'error') {
        return
    }
    Object.entries(resp.data.courses as Course[][]).forEach(item => {
        courseGroupOptionFields.value.push({ value: item[0], text: item[0] })
        item[1].forEach(course => {
            courses.push(course)
        })
    })
}

laodCourses()


watch(selectedCourseGroup, async (gName) => {
    selectedCourseData.value = null
    coursesOptionFields.value = []
    let groups = courses.filter(c => c.name == gName)
    if (groups.length === 1) {
        selectedCourseForTable.value = groups[0].id
    } else {
        selectedCourseForTable.value = 0
        groups.forEach(group => {
            coursesOptionFields.value.push({ value: group.id, text: group.group_name ? group.group_name : 'No Name' })
        })
    }
})

watch(selectedCourseForTable, async (courseId) => {
    if (courseId === 0) return;
    selectedCourseData.value = courses.find(c => c.id == courseId)!
    emit('course', selectedCourseData.value)
})
</script>

<template>
    <div class="flex justify-between items-center">
        <div class="flex items-center mr-5">
            <h4 class="mr-5 font-semibold">Select a Course</h4>
            <SelectionBox :options="courseGroupOptionFields" :value="selectedCourseGroup"
                @input="(val) => { selectedCourseGroup = val }" class="w-[300px] mr-5" />

            <h4 class="mr-5 font-semibold ml-10" v-show="coursesOptionFields.length !== 0">Select a Group
            </h4>
            <SelectionBox v-show="coursesOptionFields.length !== 0" :options="coursesOptionFields"
                :value="selectedCourseForTable" @input="(val) => { selectedCourseForTable = val }"
                class="w-[300px] mr-5" />
        </div>
    </div>
    <div class="mb-10 grid grid-cols-3 gap-x-10 border rounded-xl py-3 px-10 mt-4 text-slate-600">
        <div class="">
            <h1 class="font-semibold text-lg">Basic Info</h1>
            <div class="grid grid-cols-2 ml-5">
                <h4>Instructor</h4>
                <h4>{{ selectedCourseData ? selectedCourseData.instructor.name : '' }}</h4>
            </div>
            <div class="grid grid-cols-2 ml-5">
                <h4>Enrollment Open</h4>
                <h4>{{ selectedCourseData ? (selectedCourseData.enrollment_open ? 'Open' : 'Closed') : ''
                    }}
                </h4>
            </div>
        </div>
        <div>
            <h1 class="font-semibold text-lg">Schedule</h1>
            <div class="grid grid-cols-2 ml-5">
                <h4>Day</h4>
                <h4>{{ selectedCourseData ? selectedCourseData.schedule[0].day : '' }}</h4>
            </div>
            <div class="grid grid-cols-2 ml-5">
                <h4>Time</h4>
                <h4>{{ selectedCourseData ? selectedCourseData.schedule[0].time : '' }}</h4>
            </div>
            <div class="grid grid-cols-2 ml-5">
                <h4>Venue / Hall</h4>
                <h4>{{ selectedCourseData ? selectedCourseData.schedule[0].venue : '' }}</h4>
            </div>
        </div>
        <div>
            <h1 class="font-semibold text-lg">Course Fee</h1>
            <div class="grid grid-cols-2 ml-5">
                <h4>Fee Type</h4>
                <h4>{{ selectedCourseData ? selectedCourseData.fee.type : '' }}</h4>
            </div>
            <div class="grid grid-cols-2 ml-5">
                <h4>Fee</h4>
                <h4>{{ selectedCourseData ? selectedCourseData.fee.amount : '' }}</h4>
            </div>
        </div>
    </div>
</template>