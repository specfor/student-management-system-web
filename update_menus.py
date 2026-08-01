import re

# 1. Update RightMenu.vue
with open('src/components/RightMenu.vue', 'r') as f:
    right_menu = f.read()

# Replace script
right_menu = right_menu.replace(
    "import { PrinterIcon, XCircleIcon } from '@heroicons/vue/24/outline';",
    "import { PrinterIcon, XCircleIcon, Bars3BottomRightIcon } from '@heroicons/vue/24/outline';\nimport AttendanceScanQueue from './rightMenu/AttendanceScanQueue.vue';"
)

right_menu = right_menu.replace(
    "const showPanel = ref(false)",
    "const activePanel = ref<'print' | 'scan' | null>(null)"
)

# Replace template
template_pattern = r"<div class=\"h-screen border-l-2 border-gray-400 bg-gray-300 pt-16 relative\".*?<\/div>\n\n    <\/div>"
new_template = """<div class="h-screen border-l-2 border-gray-400 bg-gray-300 pt-16 relative transition-all duration-300"
            :class="activePanel !== null ? 'w-[500px]' : 'w-0'">
            <div v-show="activePanel === 'print'" class="h-full">
                <BillPrintQueue />
            </div>
            <div v-show="activePanel === 'scan'" class="h-full overflow-hidden">
                <AttendanceScanQueue />
            </div>
            <div class="absolute flex flex-col top-0 -left-14 justify-end text-white h-full pb-10 gap-2">
                <Bars3BottomRightIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-black"
                    @click="activePanel = 'scan'" v-show="activePanel !== 'scan'" title="Scan Queue" />
                    
                <PrinterIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-black"
                    @click="activePanel = 'print'" v-show="activePanel !== 'print'" title="Print Queue" />
                    
                <XCircleIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-red-600"
                    v-show="activePanel !== null" @click="activePanel = null" title="Close Panel" />
            </div>
        </div>

    </div>"""
right_menu = re.sub(template_pattern, new_template, right_menu, flags=re.DOTALL)

with open('src/components/RightMenu.vue', 'w') as f:
    f.write(right_menu)

# 2. Update MarkAttendancePage.vue
with open('src/views/MarkAttendancePage.vue', 'r') as f:
    mark_page = f.read()

# Remove imports
mark_page = re.sub(r"import AttendanceScanQueue from '@/components/rightMenu/AttendanceScanQueue\.vue';\n", "", mark_page)
mark_page = re.sub(r"import \{ Bars3BottomRightIcon, XCircleIcon \} from '@heroicons/vue/24/outline';\n", "", mark_page)

# Remove ref
mark_page = mark_page.replace("const showScanQueue = ref(false)\n", "")

# Remove template block
template_block = r"    <div class=\"fixed right-0 top-0 z-50 pointer-events-none\">\n        <div class=\"h-screen border-l-2 border-gray-400 bg-gray-300 pt-16 relative transition-all duration-300 pointer-events-auto\"\n            :class=\"showScanQueue \? 'w-\[500px\]' : 'w-0'\">\n            <div v-show=\"showScanQueue\" class=\"h-full\">\n                <AttendanceScanQueue />\n            </div>\n            <div class=\"absolute flex flex-col top-0 -left-14 justify-end text-white h-full pb-28\">\n                <Bars3BottomRightIcon class=\"w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-black\"\n                    @click=\"showScanQueue = true\" v-show=\"!showScanQueue\" />\n                <XCircleIcon class=\"w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-red-600\"\n                    v-show=\"showScanQueue\" @click=\"showScanQueue = false\" />\n            </div>\n        </div>\n    </div>"
mark_page = mark_page.replace(template_block, "")
# Wait, my regex string replacement might not exactly match due to newlines. Let's use a simpler regex.
mark_page = re.sub(r"\s*<div class=\"fixed right-0 top-0 z-50 pointer-events-none\">.*?<\/div>\s*<\/div>\s*<\/div>", "", mark_page, flags=re.DOTALL)

with open('src/views/MarkAttendancePage.vue', 'w') as f:
    f.write(mark_page)

