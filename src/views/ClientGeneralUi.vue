<script lang="ts" setup>
import { downloadBannerImage, getClientBanners } from '@/apiConnections/client-banners';
import { getGeneralClientStatus, getLocalFingerprintStatus } from '@/apiConnections/general-client-ui';
import LoadingCursor from '@/components/minorUiComponents/loadingCursor.vue';
import type { ClientBanner } from '@/types/client-banners';
import type { Student } from '@/types/studentTypes';
import { ref, type Ref } from 'vue';

const bannerData: Ref<ClientBanner[]> = ref([]);
const bannerImageUrls: Ref<Map<string, string>> = ref(new Map());
const bannerImageUrl = ref('');
const mode: Ref<"home" | "register" | "mark-attendance" | "action-pending" | "fingerprint-not-found"> = ref("home");
const lastAttendance: Ref<{ marked_time: string, course: string, student: string, student_id: number, course_id: number }> =
    ref({ marked_time: "", course: "", student: "", student_id: 0, course_id: 0 });

const student: Ref<Student | null> = ref(null)

let markedAttendanceShowStartTime = 0;

const regStatusMsg = ref("Place your finger on the sensor.")
const regStatusStyles = ref("bg-yellow-200 text-yellow-700")

let currentBannerIndex = 0;

async function downloadImage(bannerId: number, imageId: string) {
    if (bannerImageUrls.value.has(imageId)) {
        return;
    } else {
        const response = await downloadBannerImage(bannerId);
        if (response.status == 'error') {
            return;
        } else {
            const imageUrl = URL.createObjectURL(response.data.file);
            bannerImageUrls.value.set(imageId, imageUrl);
        }
    }
}

async function fetchBanners() {
    const resp = await getClientBanners(0, null, { filters: { active: true } });
    if (resp.status == 'error') {
        return
    } else {
        bannerData.value = resp.data.banners;
        bannerData.value.forEach((banner) => {
            if (banner.image) {
                downloadImage(banner.id, banner.image);
            }
        });
    }
    setBannerImageUrl();
}

function setBannerImageUrl() {
    const nextIndex = (currentBannerIndex + 1) % bannerData.value.length;
    bannerImageUrl.value = bannerImageUrls.value.get(bannerData.value[nextIndex].image) || '';
    setTimeout(setBannerImageUrl, bannerData.value[currentBannerIndex].seconds_to_show * 1000);
    currentBannerIndex = nextIndex ?? 0;
}

fetchBanners()

async function getStatus() {
    const resp = await getGeneralClientStatus()
    if (resp.status == 'error') {
        return
    }

    if (mode.value == 'register' && resp.data.fingerprint.mode == 'read-mark-attendance') {
        regStatusStyles.value = "bg-green-200 text-green-700"
        regStatusMsg.value = "You did it. Fingerprint registration successful."

        setTimeout(() => {
            mode.value = 'home'
            student.value = null
        }, 5000);
        return
    }

    if (markedAttendanceShowStartTime != 0 && Date.now() - markedAttendanceShowStartTime < 4000) {
        return
    }

    if (resp.data.fingerprint.mode == 'read-mark-attendance' && resp.data.last_attendance != null && lastAttendance.value.marked_time != resp.data.last_attendance.marked_time) {
        if (lastAttendance.value.marked_time != "")
            mode.value = 'mark-attendance'

        localStorage.setItem('last_attendance', JSON.stringify(resp.data.last_attendance))
        lastAttendance.value = resp.data.last_attendance
        markedAttendanceShowStartTime = Date.now()
    } else if (resp.data.fingerprint.mode == 'read-mark-attendance')
        mode.value = 'home'
    else if (resp.data.fingerprint.mode == 'register') {
        mode.value = 'register'
        student.value = resp.data.student

        const fingerprintStatus = resp.data.fingerprint.reg_status

        regStatusStyles.value = "bg-yellow-200 text-yellow-700"
        if (fingerprintStatus.status == 'pending')
            regStatusMsg.value = "Place your finger on the sensor."
        else if (fingerprintStatus.status == 'ongoing') {
            const stepsLeft = 3 - Number(fingerprintStatus.msg.split(' ')[1])
            let promoteText = "Let's do this. "
            if (stepsLeft == 1)
                promoteText = "Just one more time. "
            else if (stepsLeft == 2)
                promoteText = "Almost there. "
            regStatusMsg.value = promoteText + "Press finger on sensor " + stepsLeft + " more times."
        }
        else if (fingerprintStatus.status == 'error')
            if (fingerprintStatus.status == 'error') {
                regStatusStyles.value = "bg-red-200 text-red-700"
                if (fingerprintStatus.msg == 'already-registered')
                    regStatusMsg.value = "Fingerprint is already registered."
                else if (fingerprintStatus.msg == 'not-same-finger') {
                    regStatusMsg.value = "Place the same finger. Try again"
                }
            }
    }

}

setInterval(() => {
    getStatus()
}, 1000);

const date = ref("");
const time = ref("");

setInterval(() => {
    const now = new Date();
    date.value = now.toLocaleDateString();
    time.value = now.toLocaleTimeString();
}, 1000);


let lastFinStatus: { status: "idle" | "found-finger-match" | "not-found-finger-match", update_time: number } = { status: "idle", update_time: 0 }

async function getLocalFinStatus() {
    const resp = await getLocalFingerprintStatus()
    if (resp.status != 'success') {
        return
    }

    if (lastFinStatus.update_time != resp.data.update_time) {
        if (resp.data.status == 'found-finger-match') {
            mode.value = 'action-pending'
        } else if (resp.data.status == 'not-found-finger-match') {
            mode.value = 'fingerprint-not-found'
            setTimeout(() => {
                mode.value = 'home'
            }, 6000);
        }
    }

    lastFinStatus = resp.data
}

setInterval(() => {
    getLocalFinStatus()
}, 1000);
</script>

<template>
    <div class="h-screen">
        <div class="flex h-full">
            <div class="border-r-4 border-gray-200 flex flex-col justify-between"
                :class="mode == 'home' ? 'w-[500px]' : 'w-full'">
                <div class="flex flex-col items-center" v-show="mode === 'home'">
                    <img src="/logo.png" alt="Logo" class="w-[200px] h-[200px] object-contain my-10" />
                    <p class="px-5 text-3xl text-center">Place your finger to mark attendance. If you are not a
                        registered student go to the counter</p>
                </div>

                <div v-show="mode === 'action-pending'"
                    class="flex flex-col items-center justify-center pt-10 px-5 h-full">
                    <p class="text-3xl bg-green-400 text-green-800 px-6 py-4">Found a matching fingerprint.</p>
                    <p class="text-2xl mt-5">Looking for enrolled courses...</p>
                    <LoadingCursor class="h-[400px]" />
                </div>

                <div v-show="mode === 'fingerprint-not-found'"
                    class="flex flex-col items-center justify-center pt-10 px-5 h-full">
                    <p class="text-3xl font-bold text-center bg-red-300 text-red-800 px-6 py-4">Fingerprint Not Matched.
                        Try Again....</p>
                    <p class="mt-20 text-xl">Please go to the counter if this issue persists or to register your
                        fingerprint.</p>
                </div>

                <div v-show="mode === 'register'" class="flex flex-col items-center justify-center pt-10 px-5 h-full">
                    <p class="text-3xl font-bold text-center">Register Student Fingerprint</p>

                    <div class="grid grid-cols-3 mt-20 gap-3 w-full text-xl max-w-lg">
                        <p class="font-semibold">Student Id</p>
                        <p class="col-span-2">{{ student?.custom_id ?? '-' }}</p>
                        <p class="font-semibold">Name</p>
                        <p class="col-span-2">{{ student?.name ?? "-" }}</p>
                        <p class="font-semibold">Grade</p>
                        <p class="col-span-2">{{ student?.grade ?? "-" }}</p>
                    </div>

                    <p class="mt-20 text-lg">Hi, it's just few steps. Let's add your fingerprint.</p>
                    <p class="mt-10 text-2xl text-center p-4" :class="regStatusStyles">{{ regStatusMsg }}</p>
                </div>

                <div class="pt-10 px-5 flex flex-col items-center justify-center" v-show="mode === 'mark-attendance'">
                    <p class="text-3xl font-bold text-center">Mark Attendance</p>

                    <div class="grid grid-cols-3 mt-20 gap-3 w-full text-xl max-w-lg">
                        <p class="font-semibold">Student Id</p>
                        <p class="col-span-2">{{ lastAttendance.student_id }}</p>
                        <p class="font-semibold">Name</p>
                        <p class="col-span-2">{{ lastAttendance.student }}</p>
                        <p class="font-semibold">Course</p>
                        <p class="col-span-2">{{ lastAttendance.course }}</p>
                    </div>

                    <p class="text-2xl mt-20 bg-green-500 text-white px-5 py-5">Your Attendance is Marked</p>
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
                <div v-if="bannerImageUrl === ''" class="flex items-center justify-center h-full">
                    <p class="text-2xl">Loading...</p>
                </div>
                <img v-show="bannerImageUrl !== ''" :src="bannerImageUrl" alt="banner images"
                    class="w-full h-full object-contain object-center transition-all" />
                <p class="text-right">Software by ekaivalabs.com </p>
            </div>
        </div>
    </div>
</template>