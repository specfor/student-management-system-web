<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { getDailyIncomeSummary } from '@/apiConnections/analytics';
import { useAlertsStore } from '@/stores/alerts';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/solid';

const alerts = useAlertsStore();

const date = ref(new Date().toISOString().slice(0, 10));
const totalIncome = ref(0);
const userBreakdown = ref<any[]>([]);
const isCollapsed = ref(false);
const isLoading = ref(false);

async function loadData() {
  isLoading.value = true;
  try {
    const resp = await getDailyIncomeSummary(date.value);
    if (resp.status === 'success') {
      totalIncome.value = resp.data.total_income;
      userBreakdown.value = resp.data.user_breakdown;
    } else {
      alerts.insertAlert('Error', resp.message || 'Failed to load daily income', 'error');
    }
  } catch (err) {
    alerts.insertAlert('Error', 'An unexpected error occurred', 'error');
  } finally {
    isLoading.value = false;
  }
}

watch(date, () => {
  loadData();
});

onMounted(() => {
  loadData();
});

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<template>
  <div class="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8 transition-all duration-300">
    <div 
      class="flex justify-between items-center p-5 cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50/50 hover:from-blue-100 hover:to-indigo-100/50 transition-colors"
      @click="toggleCollapse"
    >
      <div class="flex items-center gap-4">
        <div class="p-2.5 bg-blue-500 rounded-lg shadow-sm">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800 tracking-tight">Daily Income Summary</h2>
          <p class="text-sm text-gray-500 font-medium mt-0.5">Total Income: <span class="text-blue-600 font-semibold">{{ totalIncome.toLocaleString() }} LKR</span></p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <input 
          type="date" 
          v-model="date" 
          @click.stop 
          class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
        />
        <button class="text-gray-400 hover:text-gray-600 transition-colors p-1">
          <ChevronUpIcon v-if="!isCollapsed" class="w-6 h-6" />
          <ChevronDownIcon v-else class="w-6 h-6" />
        </button>
      </div>
    </div>
    
    <div v-show="!isCollapsed" class="p-5 border-t border-gray-50">
      <div v-if="isLoading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
      
      <div v-else-if="userBreakdown.length === 0" class="text-center py-8 text-gray-400 font-medium">
        No income recorded for this date.
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div 
          v-for="user in userBreakdown" 
          :key="user.id" 
          class="bg-gray-50/50 rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-sm text-gray-500 font-medium mb-1">Marked By</p>
              <h3 class="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{{ user.name }}</h3>
            </div>
            <div class="bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-sm">
              {{ user.total.toLocaleString() }} LKR
            </div>
          </div>
          
          <div class="space-y-3 pt-4 border-t border-gray-200/60">
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-600 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
                Class Payments
              </span>
              <span class="font-semibold text-gray-800">{{ user.breakdown.class_payment.toLocaleString() }} LKR</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-600 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                Admission Fees
              </span>
              <span class="font-semibold text-gray-800">{{ user.breakdown.admission.toLocaleString() }} LKR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
