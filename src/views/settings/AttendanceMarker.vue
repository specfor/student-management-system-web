<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import {
  createBanner,
  deleteBanner,
  downloadBannerImage,
  downloadBannerVideo,
  getClientBanners,
  updateBanner,
  uploadBannerImage,
  uploadBannerVideo,
} from "@/apiConnections/client-banners";
import CollapseCard from "@/components/minorUiComponents/CollapseCard.vue";
import LoadingCursor from "@/components/minorUiComponents/loadingCursor.vue";
import NewItemButton from "@/components/minorUiComponents/NewItemButton.vue";
import PaginateComponent from "@/components/PaginateComponent.vue";
import { useAlertsStore } from "@/stores/alerts";
import { useConfirmationFormsStore } from "@/stores/formManagers/confirmationForm";
import { useDataEntryFormsStore } from "@/stores/formManagers/dataEntryForm";
import type { ClientBanner } from "@/types/client-banners";
import { getBannerMediaId, getBannerMediaType, isBannerMediaAvailable } from "@/utils/bannerUtils";
import { PencilSquareIcon, TrashIcon } from "@heroicons/vue/24/solid";
import { ref, type Ref } from "vue";

const alertStore = useAlertsStore();
const dataEntryForm = useDataEntryFormsStore();
const confirmationForm = useConfirmationFormsStore();

const bannerData: Ref<ClientBanner[]> = ref([]);
const isLoading = ref(false);

const itemsPerPage = 12;
const totalCount = ref(0);
const currentPage = ref(1);

const downloadedMedia: Ref<Map<string, string>> = ref(new Map());

async function fetchBanners() {
  isLoading.value = true;
  const startIndex = currentPage.value * itemsPerPage - itemsPerPage;
  const response = await getClientBanners(startIndex, itemsPerPage);

  if (response.status == "error") {
    alertStore.insertAlert("Data fetch error", "Unable to fetch data from server.", "error");
  } else {
    bannerData.value = response.data.banners;
    bannerData.value.forEach((banner) => {
      if (isBannerMediaAvailable(banner)) {
        const mediaId = getBannerMediaId(banner)!;
        const mediaType = getBannerMediaType(banner);
        downloadMedia(banner.id, mediaId, mediaType);
      }
    });
    totalCount.value = response.data.tot_count;
  }
  isLoading.value = false;
}

async function downloadMedia(bannerId: number, mediaId: string, type: "image" | "video") {
  const cacheKey = `${bannerId}_${type}_${mediaId}`;

  if (downloadedMedia.value.has(cacheKey)) {
    return;
  }

  try {
    let response;
    if (type === "image") {
      response = await downloadBannerImage(bannerId);
    } else {
      response = await downloadBannerVideo(bannerId);
    }

    if (response.status === "error") {
      alertStore.insertAlert(`${type} download error`, `Unable to download ${type}.`, "error");
      return;
    } else {
      const mediaUrl = URL.createObjectURL(response.data.file);
      downloadedMedia.value.set(cacheKey, mediaUrl);
    }
  } catch (error) {
    alertStore.insertAlert(`${type} download error`, `Failed to download ${type}.`, "error");
  }
}

async function addNewImageBanner() {
  dataEntryForm.newDataEntryForm("Add New Image Banner", "Create", [
    {
      name: "seconds_to_show",
      type: "number",
      text: "Seconds to show",
      required: true,
    },
    {
      name: "image",
      type: "file",
      text: "Banner Image",
      preview: true,
      accept: "image/*",
      required: true,
    },
  ]);

  while (true) {
    const results = await dataEntryForm.waitForSubmittedData();
    if (!results.submitted) return;

    const imageFile = (results.data["image"] as any)[0];

    let uploadResp = await uploadBannerImage(imageFile);

    if (uploadResp.status == "error") {
      alertStore.insertAlert("Image upload error", "Unable to upload image.", "error");
      return;
    } else {
      const imageId = uploadResp.data.image;
      const secondsToShow = results.data["seconds_to_show"];
      const createResp = await createBanner("image", imageId, secondsToShow as number);
      if (createResp.status == "error") {
        alertStore.insertAlert("Banner creation error", "Unable to create banner.", "error");
      } else {
        alertStore.insertAlert("Banner created", "New banner created successfully.", "success");
        fetchBanners();
        dataEntryForm.finishSubmission();
        return;
      }
    }
  }
}

async function addNewVideoBanner() {
  dataEntryForm.newDataEntryForm("Add New Video Banner", "Create", [
    {
      name: "seconds_to_show",
      type: "number",
      text: "Seconds to show",
      required: true,
    },
    {
      name: "video",
      type: "file",
      text: "Banner Video",
      preview: true,
      accept: "video/*",
      required: true,
    },
  ]);

  while (true) {
    const results = await dataEntryForm.waitForSubmittedData();
    if (!results.submitted) return;

    const videoFile = (results.data["video"] as any)[0];

    let uploadResp = await uploadBannerVideo(videoFile);

    if (uploadResp.status == "error") {
      alertStore.insertAlert("Video upload error", "Unable to upload video.", "error");
      return;
    } else {
      const videoId = uploadResp.data.video_id;
      const secondsToShow = results.data["seconds_to_show"];
      const createResp = await createBanner("video", videoId, secondsToShow as number);
      if (createResp.status == "error") {
        alertStore.insertAlert("Banner creation error", "Unable to create banner.", "error");
      } else {
        alertStore.insertAlert("Banner created", "New video banner created successfully.", "success");
        fetchBanners();
        dataEntryForm.finishSubmission();
        return;
      }
    }
  }
}

async function editBanner(bannerId: number) {
  const banner = bannerData.value.find((b) => b.id == bannerId);
  if (!banner) {
    alertStore.insertAlert("Banner not found", "Unable to find the specified banner.", "error");
    return;
  }

  dataEntryForm.newDataEntryForm("Edit Banner", "Update", [
    {
      name: "seconds_to_show",
      type: "number",
      text: "Seconds to show",
      required: true,
      value: banner.seconds_to_show,
    },
    {
      name: "active",
      type: "select",
      text: "Status",
      required: true,
      options: [
        { value: "published", text: "Published" },
        { value: "draft", text: "Draft" },
      ],
      value: banner.active ? "published" : "draft",
    },
  ]);

  while (true) {
    const results = await dataEntryForm.waitForSubmittedData();
    if (!results.submitted) return;

    const secondsToShow = results.data["seconds_to_show"];
    const createResp = await updateBanner(bannerId, secondsToShow as number, results.data["active"] == "published");
    if (createResp.status == "error") {
      alertStore.insertAlert("Banner update error", "Unable to update banner.", "error");
    } else {
      alertStore.insertAlert("Banner updated", "Banner updated successfully.", "success");
      fetchBanners();
      dataEntryForm.finishSubmission();
      return;
    }
  }
}

async function removeBanner(bannerId: number) {
  let confirmed = await confirmationForm.newConfirmationForm(
    "Delete Banner",
    "Are you sure you want to delete this banner?"
  );
  if (!confirmed) {
    return;
  }

  const response = await deleteBanner(bannerId);
  if (response.status == "error") {
    alertStore.insertAlert("Banner deletion error", "Unable to delete banner.", "error");
  } else {
    alertStore.insertAlert("Banner deleted", "Banner deleted successfully.", "success");
    fetchBanners();
  }
}

fetchBanners();
</script>

<template>
  <div class="bg-slate-200 w-full h-full">
    <div class="container my-10">
      <CollapseCard header="Banner Slideshow" header-text-css="text-2xl font-semibold" header-css="my-2 mx-2">
        <p>These are the images and videos shown on the student attendance marking system monitor as a slide show.</p>
        <div class="flex justify-end mb-10 gap-3">
          <NewItemButton @click="addNewImageBanner" text="Add Image Banner" />
          <NewItemButton @click="addNewVideoBanner" text="Add Video Banner" />
        </div>

        <div v-if="isLoading" class="text-center">
          <LoadingCursor />
        </div>

        <div v-else>
          <div class="grid grid-cols-4 gap-5">
            <div v-for="banner in bannerData" :key="banner.id" class="border w-full mb-2 relative">
              <p
                class="absolute top-5 left-5 px-3 py-2 text-sm rounded-md text-white font-semibold z-10"
                :class="banner.active ? 'bg-green-500' : 'bg-yellow-500'"
              >
                {{ banner.active ? "Published" : "Draft" }}
              </p>
              <p class="absolute top-5 right-5 px-3 py-2 text-sm rounded-md text-white font-semibold z-10 bg-blue-600">
                {{ getBannerMediaType(banner).toUpperCase() }}
              </p>
              <div>
                <div
                  v-show="
                    !downloadedMedia.get(`${banner.id}_${getBannerMediaType(banner)}_${getBannerMediaId(banner)}`)
                  "
                  class="w-full h-[200px] bg-gray-300 animate-pulse"
                ></div>
                <!-- Image Display -->
                <img
                  v-show="
                    getBannerMediaType(banner) === 'image' &&
                    downloadedMedia.get(`${banner.id}_${getBannerMediaType(banner)}_${getBannerMediaId(banner)}`)
                  "
                  :src="downloadedMedia.get(`${banner.id}_${getBannerMediaType(banner)}_${getBannerMediaId(banner)}`)"
                  alt="Banner Image"
                  class="w-full h-[200px] object-fill object-center"
                />
                <!-- Video Display -->
                <video
                  v-show="
                    getBannerMediaType(banner) === 'video' &&
                    downloadedMedia.get(`${banner.id}_${getBannerMediaType(banner)}_${getBannerMediaId(banner)}`)
                  "
                  :src="downloadedMedia.get(`${banner.id}_${getBannerMediaType(banner)}_${getBannerMediaId(banner)}`)"
                  class="w-full h-[200px] object-fill object-center"
                  autoplay
                  muted
                  loop
                ></video>
              </div>
              <div class="flex justify-end mt-2 mr-5">
                <PencilSquareIcon
                  class="h-6 w-6 fill-blue-500 active:fill-blue-700 mr-2 hover:cursor-pointer"
                  @click="
                    () => {
                      editBanner(banner.id);
                    }
                  "
                />
                <TrashIcon
                  class="h-6 w-6 fill-red-500 active:fill-red-700 hover:cursor-pointer"
                  @click="
                    () => {
                      removeBanner(banner.id);
                    }
                  "
                />
              </div>
              <p class="px-4 my-3">Seconds Shown - {{ banner.seconds_to_show }}</p>
            </div>
          </div>
          <PaginateComponent
            :page-size="itemsPerPage"
            :total-count="totalCount"
            @load-page-emit="
              (startIndex) => {
                currentPage = ((startIndex / (itemsPerPage ?? 30)) | 0) + 1;
                fetchBanners();
              }
            "
            :current-page="currentPage"
            class="mt-5"
          />
        </div>
      </CollapseCard>
    </div>
  </div>
</template>

<style scoped>
/* Your scoped styles here */
</style>
