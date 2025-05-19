<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['filter']);

const filters = ref({
    name: null,
    dni: null,
    email: null,
    position: null,
    is_active: null
});

const activeFilterCount = computed(() => {
    return Object.values(filters.value).filter((val) => val !== null).length;
});

const handleFilter = () => {
    emit('filter', { ...filters.value });
};

const clearFilters = () => {
    filters.value = {
        name: null,
        dni: null,
        email: null,
        position: null,
        is_active: null
    };
    emit('filter', {});
};
</script>

<template>
    <div class="card p-fluid mb-4">
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-medium">Filtros</h3>
            <Button label="Limpiar" icon="pi pi-filter-slash" class="p-button-text p-button-sm" :disabled="activeFilterCount === 0" @click="clearFilters" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="field">
                <label for="filter-name">Nombre</label>
                <InputText id="filter-name" v-model="filters.name" placeholder="Filtrar por nombre" @keyup.enter="handleFilter" />
            </div>

            <div class="field">
                <label for="filter-dni">DNI</label>
                <InputText id="filter-dni" v-model="filters.dni" placeholder="Filtrar por DNI" @keyup.enter="handleFilter" />
            </div>

            <div class="field">
                <label for="filter-position">Cargo</label>
                <Dropdown
                    id="filter-position"
                    v-model="filters.position"
                    :options="[
                        { label: 'Todos', value: null },
                        { label: 'Activos', value: true },
                        { label: 'Inactivos', value: false }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    @change="handleFilter"
                />
            </div>
        </div>

        <div class="flex justify-end mt-3">
            <Button label="Aplicar Filtros" icon="pi pi-filter" class="p-button-sm" @click="handleFilter" />
        </div>
    </div>
</template>

<style scoped>
.card {
    background: var(--surface-card);
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>
