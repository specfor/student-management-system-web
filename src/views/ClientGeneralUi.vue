<script lang="ts" setup>
import { downloadBannerImage, downloadBannerVideo, getClientBanners } from "@/apiConnections/client-banners";
import { getGeneralClientStatus, getLocalFingerprintStatus } from "@/apiConnections/general-client-ui";
import LoadingCursor from "@/components/minorUiComponents/loadingCursor.vue";
import type { ClientBanner } from "@/types/client-banners";
import type { Student } from "@/types/studentTypes";
import { mediaCache } from "@/utils/mediaCache";
import { getBannerMediaId, getBannerMediaType, isBannerMediaAvailable } from "@/utils/bannerUtils";
import { ref, type Ref, onUnmounted, onMounted } from "vue";
import { echo } from "@/echo";
import { useRoute } from "vue-router";

const route = useRoute();
const bannerData: Ref<ClientBanner[]> = ref([]);
const bannerMediaUrls: Ref<Map<string, string>> = ref(new Map());
const currentBannerUrl = ref("");
const currentBannerType: Ref<"image" | "video"> = ref("image");
const mode: Ref<"home" | "register" | "mark-attendance" | "action-pending" | "fingerprint-not-found"> = ref("home");
const lastAttendance: Ref<{
  marked_time: string;
  course: string;
  student: string;
  student_id: number;
  course_id: number;
}> = ref({ marked_time: "", course: "", student: "", student_id: 0, course_id: 0 });

const student: Ref<Student | null> = ref(null);

const scanLogResult: Ref<any> = ref(null);
let markedAttendanceShowStartTime = 0;
let markedAttendanceShowDuration = 0;

function playSound(type: 'success' | 'error') {
  if (type === 'success') {
    new Audio('/success-sound.mp3').play().catch(() => {
      // Fallback if needed
    });
  } else {
    new Audio('/failure-sound.mp3').play().catch(() => {
      // Fallback if needed
    });
  }
}

const regStatusMsg = ref("Place your RFID card on the scanner.");
const regStatusStyles = ref("bg-yellow-200 text-yellow-700");

let currentBannerIndex = 0;

async function downloadMedia(bannerId: number, mediaId: string, type: "image" | "video") {
  const cacheKey = mediaCache.getCacheKey(bannerId, type, mediaId);

  // Check if media is already cached
  if (bannerMediaUrls.value.has(cacheKey)) {
    return;
  }

  // Check persistent cache first
  const cachedUrl = mediaCache.getFromCache(cacheKey);
  if (cachedUrl) {
    bannerMediaUrls.value.set(cacheKey, cachedUrl);
    return;
  }

  try {
    let response;
    if (type === "image") {
      response = await downloadBannerImage(bannerId);
    } else {
      response = await downloadBannerVideo(bannerId);
    }

    if (response.status !== "error") {
      const mediaUrl = mediaCache.addToCache(cacheKey, response.data.file);
      bannerMediaUrls.value.set(cacheKey, mediaUrl);
    }
  } catch (error) {
    console.error(`Failed to download ${type}:`, error);
  }
}

async function fetchBanners() {
  const resp = await getClientBanners(0, null, { filters: { active: true } });
  if (resp.status == "error") {
    return;
  } else {
    bannerData.value = resp.data.banners;
    bannerData.value.forEach((banner) => {
      if (isBannerMediaAvailable(banner)) {
        const mediaId = getBannerMediaId(banner)!;
        const mediaType = getBannerMediaType(banner);
        downloadMedia(banner.id, mediaId, mediaType);
      }
    });
  }
  setBannerMedia();
}

function setBannerMedia() {
  if (bannerData.value.length === 0) return;

  const nextIndex = (currentBannerIndex + 1) % bannerData.value.length;
  const currentBanner = bannerData.value[nextIndex];

  if (isBannerMediaAvailable(currentBanner)) {
    const mediaId = getBannerMediaId(currentBanner)!;
    const mediaType = getBannerMediaType(currentBanner);
    const cacheKey = mediaCache.getCacheKey(currentBanner.id, mediaType, mediaId);

    currentBannerUrl.value = bannerMediaUrls.value.get(cacheKey) || "";
    currentBannerType.value = mediaType;
  }

  setTimeout(setBannerMedia, bannerData.value[currentBannerIndex].seconds_to_show * 1000);
  currentBannerIndex = nextIndex ?? 0;
}

fetchBanners();

async function getStatus(providedData?: any) {
  let data = providedData;
  if (!data) {
    const resp = await getGeneralClientStatus();
    if (resp.status == "error") {
      return;
    }
    data = resp.data;
  }

  if (mode.value == "register" && data.fingerprint.mode == "read-mark-attendance") {
    if (data.fingerprint.reg_status && data.fingerprint.reg_status.status == 'completed') {
      regStatusStyles.value = "bg-green-200 text-green-700";
      regStatusMsg.value = "Registration successful.";

      setTimeout(() => {
        mode.value = "home";
        student.value = null;
      }, 5000);
      return;
    } else {
      // If cancelled or closed
      mode.value = "home";
      student.value = null;
      return;
    }
  }

  if (markedAttendanceShowStartTime != 0 && Date.now() - markedAttendanceShowStartTime < markedAttendanceShowDuration) {
    return;
  }

  if (data.fingerprint.mode == "read-mark-attendance" || data.fingerprint.mode == "verify") {
    mode.value = "home";
  }
  else if (data.fingerprint.mode == "register-rfid") {
    mode.value = "register";
    student.value = data.student;
    
    regStatusStyles.value = "bg-yellow-200 text-yellow-700";
    regStatusMsg.value = "Place your RFID card on the scanner to register.";
  }
  else if (data.fingerprint.mode == "register") {
    mode.value = "register";
    student.value = data.student;

    const fingerprintStatus = data.fingerprint.reg_status;

    regStatusStyles.value = "bg-yellow-200 text-yellow-700";
    if (fingerprintStatus.status == "pending") regStatusMsg.value = "Place your finger on the scanner.";
    else if (fingerprintStatus.status == "ongoing") {
      const stepsLeft = 3 - Number(fingerprintStatus.msg.split(" ")[1]);
      let promoteText = "Let's do this. ";
      if (stepsLeft == 1) promoteText = "Just one more time. ";
      else if (stepsLeft == 2) promoteText = "Almost there. ";
      regStatusMsg.value = promoteText + "Press finger on sensor " + stepsLeft + " more times.";
    } else if (fingerprintStatus.status == "error") {
      regStatusStyles.value = "bg-red-200 text-red-700";
      if (fingerprintStatus.msg == "already-registered") regStatusMsg.value = "Fingerprint is already registered.";
      else if (fingerprintStatus.msg == "not-same-finger") {
        regStatusMsg.value = "Place the same finger. Try again";
      }
    }
  }
}

onMounted(() => {
  getStatus(); // Initial fetch
  echo.channel("general-ui").listen("GeneralUIStatusUpdated", (e: any) => {
    getStatus(e.uiData);
  });
  
  echo.channel("general-ui").listen("ScanLogCreated", (e: any) => {
    scanLogResult.value = e.scanLog;
    mode.value = "mark-attendance";
    markedAttendanceShowStartTime = Date.now();
    markedAttendanceShowDuration = e.scanLog.status === 'failed' ? 6000 : 4000;
    playSound(e.scanLog.status === 'success' ? 'success' : 'error');
    
    setTimeout(() => {
      if (mode.value === "mark-attendance") {
        mode.value = "home";
      }
    }, markedAttendanceShowDuration);
  });

  echo.channel("general-ui").listen("RemotePrintRequested", (e: any) => {
    if (e.printData) {
      try {
        const payload = JSON.parse(e.printData);
        // Directly fetch the local print server to avoid the fallback loop
        fetch("http://127.0.0.1:9000/bill", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          credentials: "same-origin"
        }).then((response) => {
          return response.json();
        }).then((data) => {
          if (data.code === 0) {
            fetch("/api/print-queue/remote-print-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "success", message: "Remote print completed successfully." })
            });
          } else {
            fetch("/api/print-queue/remote-print-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "error", message: data.message || "Failed to print remotely." })
            });
          }
        }).catch((err) => {
          console.error("Local print via proxy failed:", err);
          fetch("/api/print-queue/remote-print-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "error", message: "Network error when reaching the printer proxy." })
          });
        });
      } catch (err) {
        console.error("Failed to parse remote print payload:", err);
      }
    }
  });

  // Auto-fullscreen logic
  if (route.query.auto_fullscreen === 'true') {
    // Browsers might block this without user gesture, but we try
    setTimeout(() => {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Auto fullscreen prevented by browser. User must press 'f' manually.", err);
      });
    }, 500);
  }

  // Fullscreen keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.key === "f" || e.key === "F") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Error attempting to enable full-screen mode:", err);
        });
      }
    } else if (e.key === "Escape") {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn("Error attempting to exit full-screen mode:", err);
        });
      }
    }
  });
});

const date = ref("");
const time = ref("");

setInterval(() => {
  const now = new Date();
  date.value = now.toLocaleDateString();
  time.value = now.toLocaleTimeString();
}, 1000);

let lastFinStatus: { status: "idle" | "found-finger-match" | "not-found-finger-match"; update_time: number } = {
  status: "idle",
  update_time: 0,
};

async function getLocalFinStatus() {
  const resp = await getLocalFingerprintStatus();
  if (resp.status != "success") {
    return;
  }

  if (lastFinStatus.update_time != resp.data.update_time) {
    if (resp.data.status == "found-finger-match") {
      mode.value = "action-pending";
    } else if (resp.data.status == "not-found-finger-match") {
      mode.value = "fingerprint-not-found";
      setTimeout(() => {
        mode.value = "home";
      }, 6000);
    }
  }

  lastFinStatus = resp.data;
}

setInterval(() => {
  getLocalFinStatus();
}, 1000);

// Cleanup URLs on component unmount
onUnmounted(() => {
  bannerMediaUrls.value.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      // URL might have already been revoked
    }
  });
});
</script>

<template>
  <div class="h-screen">
    <div class="flex h-full">
      <div
        class="border-r-4 border-gray-200 flex flex-col justify-between"
        :class="mode == 'home' ? 'w-[500px]' : 'w-full'"
      >
        <div class="flex flex-col items-center" v-show="mode === 'home'">
          <img src="/logo.png" alt="Logo" class="w-[200px] h-[200px] object-contain my-10" />
          <p class="px-5 text-3xl text-center">
            Place your RFID card on the scanner to mark attendance. If you are not a registered student go to the counter
          </p>
        </div>

        <div v-show="mode === 'action-pending'" class="flex flex-col items-center justify-center pt-10 px-5 h-full">
          <p class="text-3xl bg-green-400 text-green-800 px-6 py-4">Found a matching RFID.</p>
          <p class="text-2xl mt-5">Looking for enrolled courses...</p>
          <LoadingCursor class="h-[400px]" />
        </div>

        <div
          v-show="mode === 'fingerprint-not-found'"
          class="flex flex-col items-center justify-center pt-10 px-5 h-full"
        >
          <p class="text-3xl font-bold text-center bg-red-300 text-red-800 px-6 py-4">
            RFID Not Matched. Try Again....
          </p>
          <p class="mt-20 text-xl">Please go to the counter if this issue persists or to register your RFID.</p>
        </div>

        <div v-show="mode === 'register'" class="flex flex-col items-center justify-center pt-10 px-5 h-full">
          <p class="text-3xl font-bold text-center">Register Student RFID</p>

          <div class="grid grid-cols-3 mt-20 gap-3 w-full text-xl max-w-lg">
            <p class="font-semibold">Student Id</p>
            <p class="col-span-2">{{ student?.custom_id ?? "-" }}</p>
            <p class="font-semibold">Name</p>
            <p class="col-span-2">{{ student?.name ?? "-" }}</p>
            <p class="font-semibold">Grade</p>
            <p class="col-span-2">{{ student?.grade ?? "-" }}</p>
          </div>

          <p class="mt-20 text-lg">Hi, it's just a few steps. Let's add your RFID.</p>
          <p class="mt-10 text-2xl text-center p-4" :class="regStatusStyles">{{ regStatusMsg }}</p>
        </div>

        <div class="pt-10 px-5 flex flex-col items-center justify-center h-full w-full" v-if="mode === 'mark-attendance' && scanLogResult">
          <div class="w-full max-w-xl bg-white shadow-2xl rounded-2xl overflow-hidden border-4"
               :class="scanLogResult.status === 'success' ? 'border-green-400' : (scanLogResult.status === 'warning-payment' ? 'border-yellow-500' : 'border-red-400')">
            
            <div class="text-center p-6 text-white" :class="scanLogResult.status === 'success' ? 'bg-green-500' : (scanLogResult.status === 'warning-payment' ? 'bg-yellow-500 text-gray-900' : 'bg-red-500')">
              <h1 class="text-4xl font-bold mb-2">{{ (scanLogResult.status === 'success' || scanLogResult.status === 'warning-payment') ? 'Attendance Marked!' : 'Scan Failed' }}</h1>
              <p class="text-xl font-medium opacity-90">{{ scanLogResult.message }}</p>
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
        </div>

        <div class="bg-slate-200">
          <div class="flex justify-center items-center py-10">
            <div class="text-center">
              <p class="text-4xl text-gray-600">{{ time }}</p>
              <p class="font-semibold text-2xl">{{ date }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="h-full w-full py-10 px-10" :class="mode == 'home' ? 'w-full' : 'hidden'">
        <div v-if="currentBannerUrl === ''" class="flex items-center justify-center h-full">
          <p class="text-2xl">Loading...</p>
        </div>

        <!-- Display image banners -->
        <img
          v-show="currentBannerUrl !== '' && currentBannerType === 'image'"
          :src="currentBannerUrl"
          alt="banner image"
          class="w-full h-full object-contain object-center transition-all"
        />

        <!-- Display video banners -->
        <video
          v-show="currentBannerUrl !== '' && currentBannerType === 'video'"
          :src="currentBannerUrl"
          class="w-full h-full object-contain object-center transition-all"
          autoplay
          muted
          loop
          @error="console.error('Video playback error')"
        />

        <p class="text-right">Software by ekaivalabs.com</p>
      </div>
    </div>
  </div>
</template>
