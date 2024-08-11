<script setup lang="ts">
import { ref, watch, type Ref } from 'vue';
import SelectionBox from '../primary/SelectionBox.vue';
import { getInstructors } from '@/apiConnections/instructors';
import type { Instructor } from '@/types/InstructorTypes';

const selectedInstructor = ref(0)
const selectedInstructorData: Ref<Instructor | null> = ref(null)
const instructorOptionFields: Ref<{ text: string, value: any }[]> = ref([])

let instructors: Instructor[] = []

let insturctorID = defineModel<number>('insturctorId')

const emit = defineEmits<{
    instructor: [instructor: Instructor]
}>()

watch(insturctorID, (id) => {
    if (id)
        selectedInstructor.value = id
})

watch(selectedInstructor, async (sID) => {
    insturctorID.value = sID
    if (instructors.length === 0)
        await new Promise((resolve) => {
            let id = setInterval(() => {
                if (instructors.length > 0) {
                    clearInterval(id)
                    resolve(true)
                }
            }, 100)
        })

    let fuoundInstructor = instructors.find(s => s.id == sID)
    if (!fuoundInstructor)
        return
    selectedInstructorData.value = fuoundInstructor
    emit('instructor', selectedInstructorData.value)
})

async function loadInstructors() {
    const resp = await getInstructors()
    if (resp.status === 'error')
        return

    instructors = resp.data.instructors
    instructors.forEach(instructor => {
        instructorOptionFields.value.push({ text: instructor.name, value: instructor.id })
    })
}
loadInstructors()
</script>

<template>
    <div class="flex items-center">
        <p class="font-semibold mr-10">Select the Instructor</p>
        <SelectionBox :options="instructorOptionFields" :value="selectedInstructor"
            @input="(val) => { selectedInstructor = val }" class="w-[300px] mr-5" />
    </div>
</template>