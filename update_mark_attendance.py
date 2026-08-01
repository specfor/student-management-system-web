import re

with open('src/views/MarkAttendancePage.vue', 'r') as f:
    content = f.read()

# Add imports
import_pattern = r"import BillEnroller from '@/components/BillEnroller\.vue';"
new_imports = "import BillEnroller from '@/components/BillEnroller.vue';\nimport AttendanceScanQueue from '@/components/rightMenu/AttendanceScanQueue.vue';\nimport { Bars3BottomRightIcon, XCircleIcon } from '@heroicons/vue/24/outline';"
content = content.replace(import_pattern, new_imports)

# Add showScanQueue ref
ref_pattern = r"const showBillEnroller = ref\(false\)"
new_ref = "const showBillEnroller = ref(false)\nconst showScanQueue = ref(false)"
content = content.replace(ref_pattern, new_ref)

# Add template UI
template_pattern = r"    <BillEnroller :show=\"showBillEnroller\".*?\/>\n<\/template>"
new_template = """    <BillEnroller :show="showBillEnroller" :student-id="billEnrollerStudentId" :payment-id="paymentIdForBillEnroller"
        @close="showBillEnroller = false" />
        
    <div class="fixed right-0 top-0 z-40">
        <div class="h-screen border-l-2 border-gray-400 bg-gray-300 pt-16 relative transition-all duration-300"
            :class="showScanQueue ? 'w-[500px]' : 'w-0'">
            <div v-show="showScanQueue" class="h-full">
                <AttendanceScanQueue />
            </div>
            <div class="absolute flex flex-col top-0 -left-14 justify-end text-white h-full pb-10">
                <Bars3BottomRightIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-black"
                    @click="showScanQueue = true" v-show="!showScanQueue" />
                <XCircleIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-red-600"
                    v-show="showScanQueue" @click="showScanQueue = false" />
            </div>
        </div>
    </div>
</template>"""
content = re.sub(template_pattern, new_template, content, flags=re.DOTALL)

with open('src/views/MarkAttendancePage.vue', 'w') as f:
    f.write(content)
