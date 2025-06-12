<script setup lang="ts">
import { createUpdateClassConductRecord, resheduleClass } from '@/apiConnections/class_conduct';
import { useAlertsStore } from '@/stores/alerts';
import { ref, computed, defineProps, toRef, type Ref, watch } from 'vue';

const alertStore = useAlertsStore()

type Card = {
    title: string;
    body: string;
    timeRange: string;
    date: string;
    status: string;
    notes: string;
    courseId: number;
};

// Accept cards as a prop
const props = defineProps<{
    cards: Array<Card>;
}>();

const emit = defineEmits<{
    (e: 'update:cards', card: Card): void;
    (e: 'update:date', date: Date): void;
}>();

let allCards = toRef(props, 'cards');

const showCards: Ref<typeof allCards.value> = ref([]);

watch(props, (newProps) => {
    showCards.value = newProps.cards
})

// Modes: 'week' or 'month'
const mode = ref<'week' | 'month'>('week');
const today = new Date();
const currentDate = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

watch(currentDate, () => {
    emit('update:date', currentDate.value)
})

function formatDate(date: Date) {
    // Use local time zone for formatting
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getStartOfWeek(date: Date) {
    // Use local time zone for week calculation
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - d.getDay());
    return d;
}

function getDaysInMonth(year: number, month: number) {
    // Use local time zone for month calculation
    return new Date(year, month + 1, 0).getDate();
}

const days = computed(() => {
    if (mode.value === 'week') {
        const start = getStartOfWeek(currentDate.value);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            d.setDate(start.getDate() + i);
            return d;
        });
    } else {
        const year = currentDate.value.getFullYear();
        const month = currentDate.value.getMonth();
        const numDays = getDaysInMonth(year, month);
        return Array.from({ length: numDays }, (_, i) => {
            return new Date(year, month, i + 1);
        });
    }
});

function getCardsForDate(date: string) {
    return allCards.value.filter(card => card.date === date);
}

function prev() {
    if (mode.value === 'week') {
        currentDate.value.setDate(currentDate.value.getDate() - 7);
        currentDate.value = new Date(currentDate.value);
    } else {
        currentDate.value.setMonth(currentDate.value.getMonth() - 1);
        currentDate.value = new Date(currentDate.value);
    }
}

function next() {
    if (mode.value === 'week') {
        currentDate.value.setDate(currentDate.value.getDate() + 7);
        currentDate.value = new Date(currentDate.value);
    } else {
        currentDate.value.setMonth(currentDate.value.getMonth() + 1);
        currentDate.value = new Date(currentDate.value);
    }
}

// Modal state for card details
const showCardModal = ref(false);
const selectedCard = ref<Card | null>(null);

// Modal extra state
const statusOptions = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'];
const selectedStatus = ref('Scheduled');
const notes = ref('');

function openCardModal(card: Card) {
    showReschedule.value = false;
    selectedCard.value = card;
    showCardModal.value = true;
    selectedStatus.value = card.status.charAt(0).toUpperCase() + card.status.slice(1); // Reset or set default
    notes.value = card.notes || ''; // Reset or set default
}
function closeCardModal() {
    showCardModal.value = false;
    selectedCard.value = null;
}

async function updateClassConduct() {
    if (!selectedCard.value) return;

    const sTime = selectedCard.value.timeRange.split('-')[0];
    const eTime = selectedCard.value.timeRange.split('-')[1];

    const resp = await createUpdateClassConductRecord(
        selectedCard.value.courseId, selectedCard.value.date, selectedStatus.value.toLowerCase(), notes.value, sTime, eTime);
    if (resp.status === 'success') {
        // Update the card in the showCards array
        const index = showCards.value.findIndex(card => card.title === selectedCard.value?.title && card.date === selectedCard.value?.date);
        if (index !== -1) {
            showCards.value[index].status = selectedStatus.value;
            showCards.value[index].notes = notes.value;
        }
        alertStore.insertAlert('Success', 'Class schedule updated successfully.', 'success');
        closeCardModal();
    } else {
        alertStore.insertAlert('Error', 'Failed to update class schedule: ' + resp.message, 'error');
    }
}

// Reschedule state
const showReschedule = ref(false);
const rescheduleDate = ref('');
const rescheduleStartTime = ref('');
const rescheduleEndTime = ref('');

function openReschedule() {
    rescheduleDate.value = selectedCard.value?.date || '';
    // Try to extract start time from timeRange if available
    rescheduleStartTime.value = selectedCard.value?.timeRange?.split('-')[0] || '';
    rescheduleEndTime.value = selectedCard.value?.timeRange?.split('-')[1] || '';
    showReschedule.value = true;
}
function closeReschedule() {
    showReschedule.value = false;
}

const handlingReschedule = ref(false);

async function handleReschedule() {
    handlingReschedule.value = true;

    if (!selectedCard.value || !rescheduleDate.value || !rescheduleStartTime.value || !rescheduleEndTime.value) return;
    // Call update function with new date and time
    const resp = await resheduleClass(
        selectedCard.value.courseId,
        selectedCard.value.date,
        rescheduleDate.value,
        rescheduleStartTime.value,
        rescheduleEndTime.value
    );
    if (resp.status === 'success') {
        alertStore.insertAlert('Success', 'Class rescheduled successfully.', 'success');
        closeReschedule();
        closeCardModal();
    } else {
        alertStore.insertAlert('Error', 'Failed to reschedule class: ' + resp.message, 'error');
    }
    handlingReschedule.value = false;
}
</script>

<template>

    <div class="p-4">
        <div class="flex items-center mb-4 gap-2">
            <button @click="prev" class="px-2 py-1 bg-gray-200 rounded">Prev</button>
            <span class="font-bold text-lg">
                <template v-if="mode === 'week'">
                    Week of {{ days[0].toLocaleDateString() }}
                </template>
                <template v-else>
                    {{ days[0].toLocaleString('default', { month: 'long' }) }} {{ days[0].getFullYear() }}
                </template>
            </span>
            <button @click="next" class="px-2 py-1 bg-gray-200 rounded">Next</button>
            <button @click="mode = 'week'"
                :class="['px-2 py-1 rounded', mode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200']">Week</button>
            <button @click="mode = 'month'"
                :class="['px-2 py-1 rounded', mode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200']">Month</button>
        </div>

        <!-- Days of week row (one time only) -->
        <div class="grid grid-cols-7 gap-2 mb-2">
            <div v-for="i in 7" :key="'label-' + i" class="text-center font-semibold text-gray-700">
                {{ new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toLocaleDateString('en-US', {
                    weekday:
                        'long'
                }) }}
            </div>
        </div>
        <div :class="mode === 'week' ? 'grid grid-cols-7 gap-2' : 'grid grid-cols-7 gap-2'"
            class="max-h-[800px] overflow-y-auto">
            <div v-for="day in days" :key="day.toISOString()" class="border rounded p-2 min-h-[120px] flex flex-col">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-semibold">{{ day.getDate() }}</span>
                </div>
                <div v-for="card in getCardsForDate(formatDate(day))" :key="card.title + card.timeRange"
                    class="cursor-pointer rounded p-1 mb-2" :class="card.status == 'scheduled' ? 'bg-blue-200 hover:bg-blue-300' :
                        card.status == 'completed' ? 'bg-green-200 hover:bg-green-300' : (card.status == 'rescheduled' ?
                            'bg-yellow-200 hover:bg-yellow-300' : 'bg-rose-200 hover:bg-rose-300')"
                    @click="openCardModal(card)">
                    <div class="font-bold truncate">{{ card.title }}</div>
                    <div class="text-md text-gray-600">{{ card.timeRange }}</div>
                </div>
            </div>
        </div>

        <!-- Modal for card details -->
        <div v-if="showCardModal" class="fixed inset-0 flex items-center justify-center z-50">
            <div class="absolute inset-0 bg-black opacity-50" @click="closeCardModal"></div>
            <div class="bg-white rounded-lg overflow-hidden shadow-lg z-10 max-w-lg w-full">
                <div class="p-4">
                    <div class="flex justify-between mb-5">
                        <span class="text-sm text-gray-500">{{ selectedCard?.timeRange }}</span>
                        <span class="text-sm text-gray-500">{{ selectedCard?.date }}</span>
                    </div>
                    <h3 class="font-bold text-lg mb-2">{{ selectedCard?.title }}</h3>
                    <p class="text-gray-700 mb-4">{{ selectedCard?.body }}</p>

                    <div class="mb-4 mt-8 grid grid-cols-3">
                        <label class="block text-md font-medium mb-1">Status</label>
                        <select v-model="selectedStatus" class="border border-gray-400 col-span-2 rounded p-1 w-full">
                            <option v-for="option in statusOptions" :key="option" :value="option">{{ option }}</option>
                        </select>
                    </div>

                    <div class="mb-4 grid grid-cols-3">
                        <label class="block text-md font-medium mb-1">Notes</label>
                        <textarea v-model="notes" class="border border-gray-400 rounded col-span-2 p-1 w-full" rows="2"
                            placeholder="Add notes..."></textarea>
                    </div>

                    <!-- Reschedule section inside modal -->
                    <div class="mt-4">
                        <button v-if="!showReschedule" @click="openReschedule"
                            class="px-4 py-2 bg-yellow-400 hover:bg-yellow-600 rounded w-full">Reschedule Class</button>
                        <div v-if="showReschedule" class="mt-4 border-t pt-4">
                            <h3 class="font-bold text-md mb-2">Reschedule Class</h3>

                            <div class="mb-4">
                                <label class="block text-md font-medium mb-1">New Date</label>
                                <input type="date" v-model="rescheduleDate"
                                    class="border border-gray-400 rounded p-2 w-full" />
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="mb-4">
                                    <label class="block text-md font-medium mb-1">Start Time</label>
                                    <input type="time" v-model="rescheduleStartTime"
                                        class="border border-gray-400 rounded p-2 w-full" />
                                </div>
                                <div class="mb-4">
                                    <label class="block text-md font-medium mb-1">End Time</label>
                                    <input type="time" v-model="rescheduleEndTime"
                                        class="border border-gray-400 rounded p-2 w-full" />
                                </div>
                            </div>
                            <div class="flex justify-end gap-2">
                                <button @click="closeReschedule"
                                    class="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">Cancel</button>
                                <button @click="handleReschedule" :disabled="handlingReschedule"
                                    class="px-4 py-2 bg-yellow-400 hover:bg-yellow-600 rounded disabled:bg-yellow-200">Confirm
                                    Reschedule</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-100 p-4 flex justify-end gap-2">
                    <button @click="closeCardModal"
                        class="px-4 py-2 bg-gray-400 hover:bg-gray-600 rounded">Close</button>
                    <button @click="updateClassConduct"
                        class="px-4 py-2 bg-blue-400 hover:bg-blue-600 rounded">Update</button>
                </div>
            </div>
        </div>
    </div>
</template>