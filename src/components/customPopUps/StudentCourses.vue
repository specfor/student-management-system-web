<script setup lang="ts">
import { ref, type Ref } from 'vue';
import TableComponent, { type TableColumns } from '../TableComponent.vue';
import { getStudentEnrollments } from '@/apiConnections/enrollments';

let courses: Ref<any[]> = ref([])
let student = ref({})
const tableColumns: TableColumns[] = [
    { label: 'ID', sortable: false }, { label: 'Course' }, { label: 'Fee' },
    { label: 'Suspended' }]

let { args } = defineProps(['args'])

async function init(studentId: number) {
    let res = await getStudentEnrollments(studentId)
    if (res.status === 'error') {
        console.log('failed to load data.');
        return
    }
    (res.data.enrollments as Enrollment[]).forEach(enrollment => {
        let cName = enrollment.course ? enrollment.course.name : 'Deleted Course'
        let fee = Number(enrollment.course ? enrollment.course.fee.amount : 'Deleted Course')
        if (enrollment.price_adjustments != null) {
            if (enrollment.price_adjustments.type == 'fixed')
                fee = fee - enrollment.price_adjustments.amount!
            else
                fee = fee * (1 - enrollment.price_adjustments.percentage!)
        }
        if (enrollment.course ? enrollment.course.group_name != null : 'Deleted Course')
            cName = cName + ' - ' + (enrollment.course ? enrollment.course.group_name : 'Deleted Course')
        courses.value.push([enrollment.course ? enrollment.course.id : 'Deleted Course', cName, fee, enrollment.suspended ? 'Suspended' : 'Not Suspended'])
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
        <h1 class="font-semibold text-xl mb-10">Student Enrolled Courses</h1>

        <TableComponent class="mt-10" :table-columns="tableColumns" :table-rows="courses" :actions="[]"
            :paginate-page-size="30" :paginate-total="30" />

    </div>
</template>