<script setup lang="ts">
import { getAttendaceOfCourseByEnrollmentId } from '@/apiConnections/attendance';
import { getEnrollmentById } from '@/apiConnections/enrollments';
import TableComponent, { type TableColumns } from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import type { Attendance } from '@/types/attendanceTypes';
import type { Enrollment } from '@/types/enrollmentTypes';
import { getRouterParam } from '@/utils/routeHelpers';
import { ref, type Ref } from 'vue';

const alertStore = useAlertsStore()

const tableColumnsAttendace: TableColumns[] = [{ label: 'Date' }, { label: 'Attended Time' }]
const tableDataAttendance: Ref<any[]> = ref([])
const countTotAttendance = ref(0)

const enrollmentId = getRouterParam('id')
const enrollment: Ref<Enrollment | null> = ref(null)

async function loadEnrollment(enID: number) {
    let resp = await getEnrollmentById(enID)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    // reversing the status order as newest are at the bottom
    let d = resp.data.enrollment
    d.status = d.status.reverse()
    enrollment.value = d
}

async function loadAttendance(startIndex?: number) {
    if (startIndex === undefined)
        startIndex = 0

    let resp = await getAttendaceOfCourseByEnrollmentId(Number(enrollmentId), startIndex, 15, { sort: { by: 'date', direction: 'desc' } })
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    tableDataAttendance.value = []
    resp.data.records.forEach((record: Attendance) => {
        tableDataAttendance.value.push([record.date, (new Date(record.created_at)).toLocaleTimeString()])
    })
    countTotAttendance.value = resp.data.tot_count
}
loadEnrollment(Number(enrollmentId))
loadAttendance()
</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="container grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div class="p-5 col-span-2  rounded-xl w-full bg-white">
                <div class="flex items-center text-xl font-semibold mb-5 bg-white w-fit py-1 px-5 rounded-md">
                    <h5 class="">Status</h5>
                    <h5 class="ml-5 border py-1 px-5 text-white rounded-md" :class="{
                        'bg-green-500': enrollment?.status[0].type === 'active',
                        'bg-yellow-500': enrollment?.status[0].type === 'pending',
                        'bg-red-500': enrollment?.status[0].type === 'discontinued',
                        'bg-blue-500': enrollment?.status[0].type === 'completed',
                    }">
                        {{
                            enrollment?.status[0].type.toUpperCase() }}</h5>
                </div>

                <div v-if="enrollment" class="p-3 ml-5">
                    <div class="grid grid-cols-3 gap-x-5 items-center mt-2">
                        <h4>Enrollment ID</h4>
                        <p class="col-span-2 border-b pl-3 border-slate-300">{{ enrollment.id }}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-x-5 items-center mt-2">
                        <h4>Student</h4>
                        <p class="col-span-2 border-b pl-3 border-slate-300">{{ enrollment.student ?
                            enrollment.student.name
                            : "Deleted" }}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-x-5 items-center mt-2">
                        <h4>Course</h4>
                        <p class="col-span-2 border-b pl-3 border-slate-300">{{ enrollment.course ?
                            enrollment.course.name :
                            "Deleted" }}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-x-5 items-center mt-2">
                        <h4>Course Fee Concessions</h4>
                        <p class="col-span-2 border-slate-300"
                            :class="{ 'border-b pl-3': enrollment.price_adjustments === null }">{{
                                enrollment.price_adjustments === null ?
                                    'Not Given' : '' }}</p>
                        <div class="grid grid-cols-3 ml-10 col-span-3 mt-3 border px-5 "
                            v-if="enrollment.price_adjustments">
                            <h5 class="mt-3">Type</h5>
                            <p class="mt-2 col-span-2 bg-gray-600 text-white w-fit px-5"
                                v-if="enrollment.price_adjustments.type === 'fixed'">
                                {{ enrollment.price_adjustments.amount }} fixed reduction</p>
                            <p class="mt-2 col-span-2 bg-gray-600 text-white w-fit px-5"
                                v-if="enrollment.price_adjustments.type === 'percentage'">
                                {{ enrollment.price_adjustments.percentage }} % reduction</p>
                            <h5 class="mt-3">Reason</h5>
                            <p class="mt-2 ">{{ enrollment.price_adjustments.reason }}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-x-5 items-center mt-2">
                        <h4>Enrolled On</h4>
                        <p class="col-span-2 border-b pl-3 border-slate-300">{{ (new
                            Date(enrollment.created_at)).toLocaleString() }}</p>
                    </div>
                    <div class="grid grid-cols-3 gap-x-5 items-center mt-2">
                        <h4>Last Updated</h4>
                        <p class="col-span-2 border-b pl-3 border-slate-300">{{ (new
                            Date(enrollment.updated_at)).toLocaleString() }}</p>
                    </div>
                    <div class="mt-2">
                        <h4>Status History</h4>
                        <div class="max-h-[150px] mt-3 ml-10 overflow-y-auto">
                            <div class="border px-5 py-3 mt-2" v-for="entry of enrollment.status"
                                :key="entry.timestamp">
                                <div class="grid grid-cols-3">
                                    <h1>Status</h1>
                                    <p class="col-span-2 w-fit px-3 text-white" :class="{
                                        'bg-green-500': entry.type === 'active',
                                        'bg-yellow-500': entry.type === 'pending',
                                        'bg-red-500': entry.type === 'discontinued',
                                        'bg-blue-500': entry.type === 'completed',
                                    }">{{ entry.type.toUpperCase() }}</p>
                                </div>
                                <div class="grid grid-cols-3">
                                    <h1>Reason</h1>
                                    <p class="col-span-2">{{ entry.reason ?? "None" }}</p>
                                </div>
                                <div class="grid grid-cols-3">
                                    <h1>Changed On</h1>
                                    <p class="col-span-2">{{ (new Date(entry.timestamp! * 1000).toLocaleString()) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-5 rounded-xl max-h-[600px] bg-white">
                <h4 class="font-semibold text-2xl mb-5">Attendance</h4>

                <div class="h-[500px]">
                    <TableComponent :table-columns="tableColumnsAttendace" :table-rows="tableDataAttendance"
                        :options="{ hideActionBar: true }" @load-page-emit="loadAttendance" :paginate-page-size="15"
                        :paginate-total="countTotAttendance" />
                </div>
            </div>
        </div>
    </div>
</template>