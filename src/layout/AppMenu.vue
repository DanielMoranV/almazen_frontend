<script setup>
import { useAuthStore } from '@/stores/authStore'; // Importa el store de autenticación
import { computed, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

// Datos del menú con restricción por posición
const model = ref([
    {
        label: 'Home',
        items: [
            { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard', positions: ['Developer', 'Administrador'] },
            { label: 'Perfil', icon: 'pi pi-fw pi-user', to: '/profile', public: true } // Elemento público
        ]
    },
    {
        label: 'Administrador',
        items: [
            { label: 'Usuarios', icon: 'pi pi-fw pi-users', to: '/users', positions: ['Administrador'] },
            { label: 'Empresas', icon: 'pi pi-fw pi-building', to: '/companies', positions: ['Administrador'] }
        ],
        positions: ['Administrador']
    },
    {
        label: 'Inventario',
        items: [
            {
                label: 'Gestión',
                icon: 'pi pi-fw pi-cog',
                items: [
                    { label: 'Almacenes', icon: 'pi pi-building', to: '/warehouses', positions: ['Developer', 'Administrador'] },
                    { label: 'Categorías', icon: 'pi pi-th-large', to: '/categories', positions: ['Developer', 'Administrador'] },
                    { label: 'Unidades', icon: 'pi pi-sliders-h', to: '/units', positions: ['Developer'] },
                    { label: 'Proveedores', icon: 'pi pi-truck', to: '/providers', positions: ['Developer', 'Administrador'] }
                ],
                positions: ['Developer', 'Administrador']
            },

            { label: 'Productos', icon: 'pi pi-tags', to: '/products', positions: ['Developer', 'Administrador'] },

            {
                label: 'Movimientos',
                icon: 'pi pi-refresh',
                items: [
                    { label: 'Entradas', icon: 'pi pi-sign-in', to: '/entries', positions: ['Developer', 'Administrador'] },
                    { label: 'Salidas', icon: 'pi pi-sign-out', to: '/outputs', positions: ['Developer', 'Administrador'] },
                    { label: 'Transferencias', icon: 'pi pi-arrow-right-arrow-left', to: '/transfers', positions: ['Developer', 'Administrador'] }
                ],
                positions: ['Developer', 'Administrador']
            }
        ]
    }
]);

const authStore = useAuthStore();
const currentPosition = computed(() => authStore.currentUser?.position || '');

// Filtrar elementos según la posición del usuario
const filteredModel = computed(() => {
    const globalAccessRoles = ['Developer']; // Roles con acceso a todo

    const hasAccess = (positions) => {
        if (!positions) return true; // Elementos sin restricción son accesibles
        return positions.includes(currentPosition.value) || globalAccessRoles.includes(currentPosition.value);
    };

    const filterItems = (items) =>
        items
            .filter((item) => hasAccess(item.positions))
            .map((item) => ({
                ...item,
                items: item.items ? filterItems(item.items) : undefined
            }));

    return model.value
        .filter((section) => hasAccess(section.positions))
        .map((section) => ({
            ...section,
            items: filterItems(section.items)
        }));
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in filteredModel" :key="item.label">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
