<script setup lang="ts">
import { getWhatsappSettings, updateWhatsappAuthSettings, updateWhatsappTemplateSettings } from '@/apiConnections/messageService';
import CollapseCard from '@/components/minorUiComponents/CollapseCard.vue';
import LoadingCursor from '@/components/minorUiComponents/loadingCursor.vue';
import { useAlertsStore } from '@/stores/alerts';
import type { WhatsappSettings } from '@/types/messageSystem';
import { ref, type Ref } from 'vue';

const alertStore = useAlertsStore();
const settings: Ref<WhatsappSettings | null> = ref(null);

const updatedAuth: Ref<{ [key: string]: string }> = ref({})
const updatedTemplates: Ref<{ [key: string]: string }> = ref({})

async function loadSettings() {
    let resp = await getWhatsappSettings();
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error');
        return;
    }

    settings.value = resp.data.settings;

    Object.keys(resp.data.settings.auth).forEach(key => {
        updatedAuth.value[key] = resp.data.settings.auth[key]
    });
    Object.keys(resp.data.settings.templates).forEach(key => {
        updatedTemplates.value[key] = resp.data.settings.templates[key]
    });
}
loadSettings()

const templateUpdateEnabled = ref(false)
const authUpdateEnabled = ref(false)
const templateSaveEnabled = ref(false)
const authSaveEnabled = ref(false)

function capitalizeWords(str: string) {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function checkUpdated() {
    authSaveEnabled.value = false
    templateSaveEnabled.value = false

    Object.keys(settings.value?.auth!).forEach(key => {
        if (settings.value?.auth![key] !== updatedAuth.value[key]) {
            authSaveEnabled.value = true
        }
    });
    Object.keys(settings.value?.templates!).forEach(key => {
        if (settings.value?.templates![key] !== updatedTemplates.value[key]) {
            templateSaveEnabled.value = true
        }
    });
}

async function updateAuthSettings() {
    let updatedFieldKeys = Object.entries(settings.value?.auth!).filter(entry => entry[1] !== updatedAuth.value[entry[0]]);
    let updatedFields: { access_token?: string, phone_num_id?: string } = {}
    updatedFieldKeys.forEach(entry => {
        if (entry[0] === 'whatsapp_access_token') {
            updatedFields.access_token = updatedAuth.value.whatsapp_access_token
        } else if (entry[0] === 'whatsapp_from_phone_number_id') {
            updatedFields.phone_num_id = updatedAuth.value.whatsapp_from_phone_number_id
        }
    });

    let resp = await updateWhatsappAuthSettings(updatedFields);
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error');
        return;
    }

    alertStore.insertAlert('Success', 'Whatsapp authentication settings updated successfully', 'success');
    loadSettings()
    authUpdateEnabled.value = false;
    authSaveEnabled.value = false;
}

async function updateTemplateSettings() {
    let updatedFieldKeys = Object.entries(settings.value?.templates!).filter(entry => entry[1] !== updatedTemplates.value[entry[0]]);
    let updatedFields: { [key: string]: string } = {}
    updatedFieldKeys.forEach(entry => {
        updatedFields[entry[0]] = updatedTemplates.value[entry[0]]
    });

    let resp = await updateWhatsappTemplateSettings(updatedFields);
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error');
        return;
    }

    alertStore.insertAlert('Success', 'Whatsapp template settings updated successfully', 'success');
    loadSettings()
    templateUpdateEnabled.value = false;
    templateSaveEnabled.value = false;
}
</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="container max-w-screen-xl my-10">
            <CollapseCard header="Whatsapp" header-text-css="text-2xl font-semibold" header-css="my-2 mx-2">
                <div class="px-2">
                    <h1 class="text-xl  font-semibold">Message Templates </h1>

                    <p class="mt-6 text-slate-600">Whatsapp only allow pre-defined and reviewed templates. You need to
                        enter names of those reviewed
                        templates here. Go to facebook business manager and create templates there if haven't done
                        already.</p>
                    <div class="mt-3 ml-5">
                        <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank"
                            class="text-blue-500 hover:underline">Facebook Business Manager</a>
                    </div>

                    <h1 class="text-lg font-semibold mr-3 mt-10">Templates</h1>
                    <div v-if="settings === null" class="mt-5">
                        <LoadingCursor />
                    </div>
                    <div v-else class="mt-5 ml-10">
                        <div class="grid grid-cols-3 items-center mt-2 text-slate-700"
                            v-for="key in Object.keys(updatedTemplates)" :key="key">
                            <p>{{ capitalizeWords(key) }}</p>
                            <input type="text"
                                class="border border-slate-300 rounded-lg p-2 col-span-2 px-4 disabled:bg-gray-200"
                                :disabled="!templateUpdateEnabled" v-model="updatedTemplates[key]"
                                @input=" checkUpdated()" />
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <button v-show="!templateUpdateEnabled" @click="templateUpdateEnabled = true"
                            class="border py-2 px-5 rounded-lg font-semibold mt-5 bg-blue-500 text-white hover:bg-blue-700 disabled:bg-blue-300">Edit</button>
                        <button v-show="templateUpdateEnabled" :disabled="!templateSaveEnabled"
                            @click="updateTemplateSettings"
                            class="border py-2 px-5 rounded-lg font-semibold mt-5 bg-blue-500 text-white hover:bg-blue-700 disabled:bg-blue-300">Update</button>
                    </div>

                    <h1 class="text-lg font-semibold mr-3 mt-10">Authentication</h1>
                    <div v-if="settings === null" class="mt-5">
                        <LoadingCursor />
                    </div>
                    <div v-else class="mt-5 ml-10">
                        <div class="grid grid-cols-3 items-center mt-2 text-slate-700"
                            v-for="key in Object.keys(updatedAuth)" :key="key">
                            <p>{{ capitalizeWords(key) }}</p>
                            <input type="text"
                                class="border border-slate-300 rounded-lg p-2 col-span-2 px-4 disabled:bg-gray-200"
                                :disabled="!authUpdateEnabled" v-model="updatedAuth[key]" @input=" checkUpdated()" />
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <button v-show="!authUpdateEnabled" @click="authUpdateEnabled = true"
                            class="border py-2 px-5 rounded-lg font-semibold mt-5 bg-blue-500 text-white hover:bg-blue-700 disabled:bg-blue-300">Edit</button>
                        <button v-show="authUpdateEnabled" :disabled="!authSaveEnabled" @click="updateAuthSettings"
                            class="border py-2 px-5 rounded-lg font-semibold mt-5 bg-blue-500 text-white hover:bg-blue-700 disabled:bg-blue-300">Update</button>
                    </div>
                </div>
            </CollapseCard>
        </div>
    </div>
</template>


<style scoped>
/* Your scoped styles here */
</style>