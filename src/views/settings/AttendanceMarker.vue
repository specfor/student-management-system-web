<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { createBanner, deleteBanner, downloadBannerImage, getClientBanners, updateBanner, uploadBannerImage } from '@/apiConnections/client-banners';
import CollapseCard from '@/components/minorUiComponents/CollapseCard.vue';
import LoadingCursor from '@/components/minorUiComponents/loadingCursor.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import PaginateComponent from '@/components/PaginateComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import type { ClientBanner } from '@/types/client-banners';
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/solid';
import { ref, type Ref } from 'vue';

const alertStore = useAlertsStore();
const dataEntryForm = useDataEntryFormsStore()
const confirmationForm = useConfirmationFormsStore()

const bannerData: Ref<ClientBanner[]> = ref([]);
const isLoading = ref(false);

const pageSize = 20;
const totalCount = ref(0);
const currentPage = ref(1);

const downloadedImages: Ref<Map<string, string>> = ref(new Map());

async function fetchBanners() {
    isLoading.value = true;
    const startIndex = currentPage.value * pageSize - pageSize;
    const response = await getClientBanners(startIndex, pageSize);

    if (response.status == 'error') {
        alertStore.insertAlert('Data fetch error', 'Unable to fetch data from server.', 'error');
    } else {
        bannerData.value = response.data.banners;
        bannerData.value.forEach((banner) => {
            if (banner.image) {
                downloadImage(banner.id, banner.image);
            }
        });
        totalCount.value = response.data.tot_count;
    }
    isLoading.value = false;
}

async function downloadImage(bannerId: number, imageId: string) {
    if (downloadedImages.value.has(imageId)) {
        return;
    } else {
        const response = await downloadBannerImage(bannerId);
        if (response.status == 'error') {
            alertStore.insertAlert('Image download error', 'Unable to download image.', 'error');
            return;
        } else {
            const imageUrl = URL.createObjectURL(response.data.file);
            downloadedImages.value.set(imageId, imageUrl);
        }
    }
}

async function addNewBanner() {
    dataEntryForm.newDataEntryForm("Add New Banner", "Create", [
        {
            name: 'seconds_to_show',
            type: 'number',
            text: 'Seconds to show',
            required: true,
        },
        {
            name: 'image',
            type: 'file',
            text: 'Banner Image',
            preview: true,
            accept: 'image/*',
            required: true,
        },
    ])

    while (true) {
        const results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        const imageFile = (results.data['image'] as any)[0];

        let uploadResp = await uploadBannerImage(imageFile)
        console.log(uploadResp);
        if (uploadResp.status == 'error') {
            alertStore.insertAlert('Image upload error', 'Unable to upload image.', 'error');
            return;
        } else {
            const imageId = uploadResp.data.image;
            const secondsToShow = results.data['seconds_to_show'];
            const createResp = await createBanner(imageId, secondsToShow as number);
            if (createResp.status == 'error') {
                alertStore.insertAlert('Banner creation error', 'Unable to create banner.', 'error');
            } else {
                alertStore.insertAlert('Banner created', 'New banner created successfully.', 'success');
                fetchBanners();
                dataEntryForm.finishSubmission()
                return;
            }
        }

    }
}

async function editBanner(bannerId: number) {
    const banner = bannerData.value.find(b => b.id == bannerId);
    if (!banner) {
        alertStore.insertAlert('Banner not found', 'Unable to find the specified banner.', 'error');
        return;
    }

    dataEntryForm.newDataEntryForm("Edit Banner", "Update", [
        {
            name: 'seconds_to_show',
            type: 'number',
            text: 'Seconds to show',
            required: true,
            value: banner.seconds_to_show,
        },
        {
            name: 'active',
            type: 'select',
            text: "Status",
            required: true,
            options: [
                { value: 'published', text: "Published" },
                { value: 'draft', text: "Draft" },
            ],
            value: banner.active ? 'published' : 'draft',
        },
    ])

    while (true) {
        const results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        const secondsToShow = results.data['seconds_to_show'];
        const createResp = await updateBanner(bannerId, secondsToShow as number, results.data['active'] == 'published');
        if (createResp.status == 'error') {
            alertStore.insertAlert('Banner update error', 'Unable to update banner.', 'error');
        } else {
            alertStore.insertAlert('Banner updated', 'Banner updated successfully.', 'success');
            fetchBanners();
            dataEntryForm.finishSubmission()
            return;
        }
    }
}

async function removeBanner(bannerId: number) {
    let confirmed = await confirmationForm.newConfirmationForm("Delete Banner", "Are you sure you want to delete this banner?");
    if (!confirmed) {
        return;
    }

    const response = await deleteBanner(bannerId);
    if (response.status == 'error') {
        alertStore.insertAlert('Banner deletion error', 'Unable to delete banner.', 'error');
    } else {
        alertStore.insertAlert('Banner deleted', 'Banner deleted successfully.', 'success');
        fetchBanners();
    }
}

fetchBanners();
</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="container my-10">
            <CollapseCard header="Banner Slideshow" header-text-css="text-2xl font-semibold" header-css="my-2 mx-2">
                <p>These are the images shown on the student attendance marking system monitor as a slide show.</p>
                <div class="flex justify-end mb-10">
                    <NewItemButton @click="addNewBanner" text="Add New Banner" />
                </div>


                <div v-if="isLoading" class="text-center">
                    <LoadingCursor />
                </div>

                <div v-else>
                    <div class="grid grid-cols-4 gap-5">
                        <div v-for="banner in bannerData" :key="banner.id" class="border w-full mb-2 relative">
                            <p class="absolute top-5 left-5 px-3 py-2 text-sm rounded-md text-white font-semibold z-10"
                                :class="banner.active ? 'bg-green-500' : 'bg-yellow-500'">
                                {{ banner.active ? "Published" : "Draft" }}</p>
                            <div>
                                <div v-show="!downloadedImages.get(banner.image)"
                                    class="w-full h-[200px] bg-gray-300 animate-pulse"></div>
                                <img v-show="downloadedImages.get(banner.image)"
                                    :src="downloadedImages.get(banner.image)" alt="Banner Image"
                                    class="w-full h-[200px] object-fill object-center" />
                            </div>
                            <div class="flex justify-end mt-2 mr-5">
                                <PencilSquareIcon
                                    class="h-6 w-6 fill-blue-500 active:fill-blue-700 mr-2 hover:cursor-pointer"
                                    @click="() => { editBanner(banner.id) }" />
                                <TrashIcon class="h-6 w-6 fill-red-500 active:fill-red-700 hover:cursor-pointer"
                                    @click="() => { removeBanner(banner.id) }" />
                            </div>
                            <p class="px-4 my-3">Seconds Shown - {{ banner.seconds_to_show }}</p>
                        </div>
                    </div>
                    <PaginateComponent :page-size="pageSize" :total-count="totalCount" @load-page-emit="(startIndex) => {
                        currentPage = ((startIndex / (pageSize ?? 30)) | 0) + 1; fetchBanners();
                    }" class="mt-5" />
                </div>
            </CollapseCard>
        </div>
    </div>
</template>

<style scoped>
/* Your scoped styles here */
</style>