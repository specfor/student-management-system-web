<script setup>

</script>

<template>
    <div class="col-span-2 grid grid-cols-2">
        <div v-for="(option, index3) in field['options']" :key="index3" class="flex mt-1">
            <input class="w-5 h-5 mt-0.5" :disabled="field['disabled']" type="checkbox" :checked="option['checked']"
                @input="event => fieldValues[field['name']][option['name']] = event.target.checked">
            <p class="ml-2 font-semibold ">{{ option['text'] }}</p>
        </div>
        <div class="mb-2 mt-1 px-2 flex items-center justify-between col-span-3 bg-red-300 text-red-900"
            v-if="errorMessages[field['name']]">
            <h1>{{ errorMessages[field['name']] }}</h1>
            <XCircleIcon class="w-5 h-5 hover:fill-white" @click="dataEntryForm.removeErrorMessage(field['name'])" />
        </div>
    </div>
</template>