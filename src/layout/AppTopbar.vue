<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/authStore';
import cache from '@/utils/cache';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { onBeforeMount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppConfigurator from './AppConfigurator.vue';

const router = useRouter();
const authStore = useAuthStore();

const logoutDialog = ref(false);
const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();

const goToProfile = () => {
    router.push({ name: 'profile' });
};

const goToCompanyConfig = () => {
    router.push({ name: 'companyConfig' });
};

const goToPos = () => {
    router.push({ name: 'pos' });
};

const goToRefresh = () => {
    cache.refresh();
    window.location.reload();
};
const confirmLogout = () => {
    logoutDialog.value = true;
};
const logout = async () => {
    await authStore.logout();
    router.push('/');
};

onMounted(async () => {
    await authStore.me();
    if (!authStore.isAuthenticated) {
        console.log('no autenticado');
        router.push('/login');
    }
});

onBeforeMount(() => {
    if (cache.getItem('darkMode') === true) {
        document.documentElement.classList.toggle('app-dark');
    }
});
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <router-link to="/dashboard" class="layout-topbar-logo">
                <img width="25px" src="/azlogo.png" alt="Logo AlmaZEN" />
                <span>AlmaZEN</span>
            </router-link>
        </div>

        <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
            <i class="pi pi-bars"></i>
        </button>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{
                            selector: '@next',
                            enterFromClass: 'hidden',
                            enterActiveClass: 'animate-scalein',
                            leaveToClass: 'hidden',
                            leaveActiveClass: 'animate-fadeout',
                            hideOnOutsideClick: true
                        }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{
                    selector: '@next',
                    enterFromClass: 'hidden',
                    enterActiveClass: 'animate-scalein',
                    leaveToClass: 'hidden',
                    leaveActiveClass: 'animate-fadeout',
                    hideOnOutsideClick: true
                }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button @click="goToPos()" type="button" class="layout-topbar-action" v-if="authStore.currentUser?.position === 'Developer' || authStore.currentUser?.position === 'Administrador' || authStore.currentUser?.position === 'Ventas' || authStore.currentUser?.position === 'Cajero'">
                        <i class="pi pi-desktop"></i>
                        <span>POS</span>
                    </button>
                    <button @click="goToRefresh()" type="button" class="layout-topbar-action">
                        <i class="pi pi-refresh"></i>
                        <span>Actualizar</span>
                    </button>
                    <button @click="goToCompanyConfig()" type="button" class="layout-topbar-action" v-if="authStore.currentUser?.position === 'Developer' || authStore.currentUser?.position === 'Administrador'">
                        <i class="pi pi-cog"></i>
                        <span>Configuración</span>
                    </button>
                    <button @click="goToProfile()" type="button" class="layout-topbar-action">
                        <i class="pi pi-user"></i>
                        <span>Perfil</span>
                    </button>
                    <button @click="confirmLogout()" type="button" class="layout-topbar-action">
                        <i class="pi pi-sign-out"></i>
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <Dialog v-model:visible="logoutDialog" :style="{ width: '450px' }" header="Cerrar Sesión" :modal="true">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span>
                Deseas cerrar sesión <b>{{ authStore.currentUser?.name || 'Usuario' }}</b
                >?
            </span>
        </div>
        <template #footer>
            <Button label="No" icon="pi pi-times" text @click="logoutDialog = false" />
            <Button label="Sí" icon="pi pi-check" @click="logout" :loading="authStore.loading" />
        </template>
    </Dialog>
</template>
