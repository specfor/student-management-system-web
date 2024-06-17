<script setup lang="ts">
import { ref } from 'vue';
import TableComponent from '../TableComponent.vue';
import { getStudentEnrollments } from '@/apiConnections/enrollments';

let courses = ref([])
let student = ref({})

let { args } = defineProps(['args'])

async function init(studentId) {
    let res = await getStudentEnrollments(studentId)
    if (res.status === 'error') {
        console.log('failed to load data.');
        return
    }
    res.data.enrollments.forEach(enrollment => {
        let cName = enrollment.course.name
        let fee = enrollment.course.fee.amount
        if (enrollment.price_adjustments != null) {
            if (enrollment.price_adjustments.type == 'fixed')
                fee = fee - enrollment.price_adjustments.amount
            else
                fee = fee * (1 - enrollment.price_adjustments.percentage)
        }
        if (enrollment.course.group_name != null)
            cName = cName + ' - ' + enrollment.course.group_name
        courses.value.push([enrollment.course.id, cName, fee, enrollment.suspended ? 'Suspended' : 'Not Suspended'])
    });
}
init(args.student.id)
</script>

<template>
    <div class="px-5 py-10">
        <!-- <div class="flex">
            <div class="flex items-center mr-10">
                <h4 class="mr-5">ID</h4>
                <h4 class="border px-3 py-1">aogaeogha</h4>
            </div>
            <div class="flex items-center">
                <h4 class="mr-5">Name</h4>
                <h4 class="border px-3 py-1">aogaeogha</h4>
            </div>
        </div> -->
        <h1 class="font-semibold text-xl">Student Enrolled Courses</h1>

        <TableComponent class="mt-10" :table-columns="['ID', 'Course', 'Fee', 'Suspended']" :table-rows="courses"
            :actions="[]" />

    </div>
</template>