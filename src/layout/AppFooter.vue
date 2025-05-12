<script setup>
import { useAuthStore } from '@/stores/authStore';
import { onMounted, ref } from 'vue';
const authStore = useAuthStore();

const companyName = ref('');

onMounted(() => {
    companyName.value = authStore.currentUser.company_name ? authStore.currentUser.company_name : 'Djasoft';
});
</script>
<template>
    <div class="layout-footer">
        AlmaZen by
        <a href="https://primevue.org" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">{{ companyName }}</a>
    </div>
</template>
