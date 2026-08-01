import re

with open('src/views/ClientGeneralUi.vue', 'r') as f:
    content = f.read()

# Add scanLogResult
ref_pattern = r"let markedAttendanceShowStartTime = 0;"
new_ref = "const scanLogResult: Ref<any> = ref(null);\nlet markedAttendanceShowStartTime = 0;"
content = content.replace(ref_pattern, new_ref)

# Add event listener
listener_pattern = r"  echo\.channel\(\"general-ui\"\)\.listen\(\"GeneralUIStatusUpdated\", \(e: any\) => \{\n    getStatus\(e\.uiData\);\n  \}\);"
new_listener = r"""  echo.channel("general-ui").listen("GeneralUIStatusUpdated", (e: any) => {
    getStatus(e.uiData);
  });
  
  echo.channel("general-ui").listen("ScanLogCreated", (e: any) => {
    scanLogResult.value = e.scanLog;
    mode.value = "mark-attendance";
    markedAttendanceShowStartTime = Date.now();
    setTimeout(() => {
      if (mode.value === "mark-attendance") {
         mode.value = "home";
         scanLogResult.value = null;
      }
    }, 7000);
  });"""
content = content.replace(listener_pattern, new_listener)

# Replace mark-attendance UI
ui_pattern = r"<div class=\"pt-10 px-5 flex flex-col items-center justify-center\" v-show=\"mode === 'mark-attendance'\">.*?<\/p>\s*<\/div>"
new_ui = r"""<div class="pt-10 px-5 flex flex-col items-center justify-center h-full w-full" v-if="mode === 'mark-attendance' && scanLogResult">
          <div class="w-full max-w-xl bg-white shadow-2xl rounded-2xl overflow-hidden border-4"
               :class="scanLogResult.status === 'success' ? 'border-green-400' : 'border-red-400'">
            
            <div class="text-center p-6 text-white" :class="scanLogResult.status === 'success' ? 'bg-green-500' : 'bg-red-500'">
              <h1 class="text-4xl font-bold mb-2">{{ scanLogResult.status === 'success' ? 'Attendance Marked!' : 'Scan Failed' }}</h1>
              <p class="text-xl opacity-90">{{ scanLogResult.message }}</p>
            </div>
            
            <div class="p-8">
              <div class="grid grid-cols-3 gap-y-4 text-xl">
                <p class="font-semibold text-gray-500">Student</p>
                <p class="col-span-2 font-bold text-gray-800">{{ scanLogResult.student?.name || 'Unknown' }} ({{ scanLogResult.student?.custom_id || '-' }})</p>
                
                <p class="font-semibold text-gray-500">Grade</p>
                <p class="col-span-2 font-bold text-gray-800">{{ scanLogResult.student?.grade?.name || '-' }}</p>
              </div>

              <div class="mt-8 border-t pt-6">
                <p class="font-semibold text-gray-500 mb-3 text-lg">Today's Classes</p>
                <div v-if="!scanLogResult.available_classes_today || scanLogResult.available_classes_today.length === 0" 
                     class="bg-gray-100 p-4 rounded-lg text-gray-600 text-center font-semibold">
                  No classes scheduled for today.
                </div>
                <div v-else class="space-y-3">
                  <div v-for="cls in scanLogResult.available_classes_today" :key="cls.course_name" 
                       class="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <span class="font-semibold text-blue-900 text-lg">{{ cls.course_name }}</span>
                    <span class="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{{ cls.time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>"""
content = re.sub(ui_pattern, new_ui, content, flags=re.DOTALL)

with open('src/views/ClientGeneralUi.vue', 'w') as f:
    f.write(content)

