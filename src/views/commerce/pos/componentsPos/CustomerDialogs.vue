<script setup>
import { defineEmits, defineProps, ref, watch } from 'vue';

const props = defineProps({
    showCustomerDialog: Boolean,
    showCreateCustomerDialog: Boolean,
    customerSearch: String,
    customerResults: Array,
    isSearchingCustomers: Boolean,
    newCustomer: Object,
    loading: Boolean
});

const emit = defineEmits(['update:showCustomerDialog', 'update:showCreateCustomerDialog', 'update:customerSearch', 'update:newCustomer', 'search-customers', 'select-customer', 'create-quick-customer']);

// Initialize internal refs with parent prop values
const internalCustomerSearch = ref(props.customerSearch || '');
const internalNewCustomer = ref(
    props.newCustomer || {
        name: '',
        email: '',
        phone: '',
        identity_document: '',
        identity_document_type: 'dni'
    }
);

// Watch for changes in parent props to sync internal state
watch(
    () => props.customerSearch,
    (newValue) => {
        if (newValue !== internalCustomerSearch.value) {
            internalCustomerSearch.value = newValue || '';
        }
    }
);

watch(
    () => props.newCustomer,
    (newValue) => {
        if (newValue && JSON.stringify(newValue) !== JSON.stringify(internalNewCustomer.value)) {
            internalNewCustomer.value = { ...newValue };
        }
    },
    { deep: true }
);

watch(internalCustomerSearch, (newValue) => {
    emit('update:customerSearch', newValue);
});

watch(
    internalNewCustomer,
    (newValue) => {
        emit('update:newCustomer', newValue);
    },
    { deep: true }
);
</script>

<template>
    <!-- Customer Selection Dialog -->
    <Dialog
        :visible="props.showCustomerDialog"
        @update:visible="$emit('update:showCustomerDialog', $event)"
        header="Seleccionar Cliente"
        :modal="true"
        :style="{ width: '95vw', maxWidth: '600px' }"
        :pt="{
            header: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
            content: 'p-6'
        }"
    >
        <template #header>
            <div class="flex items-center space-x-3">
                <i class="pi pi-users text-xl"></i>
                <span class="text-xl font-bold">Buscar y Seleccionar Cliente</span>
            </div>
        </template>

        <div class="space-y-6 mt-2">
            <!-- Customer Search -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">
                    <i class="pi pi-search mr-2 text-purple-600"></i>
                    Buscar cliente por nombre o documento
                </label>
                <AutoComplete
                    v-model="internalCustomerSearch"
                    :suggestions="props.customerResults"
                    @complete="$emit('search-customers', $event.query)"
                    option-label="name"
                    placeholder="Escriba el nombre o documento del cliente..."
                    :loading="props.isSearchingCustomers"
                    :min-length="2"
                    class="w-full"
                    :pt="{
                        root: 'w-full',
                        input: 'w-full py-3 px-4 text-base border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl',
                        panel: 'bg-white border border-gray-300 rounded-lg shadow-lg mt-1',
                        list: 'max-h-60 overflow-auto p-2',
                        item: 'p-3 hover:bg-purple-50 rounded-lg cursor-pointer border-b border-gray-100'
                    }"
                    fluid
                >
                    <template #option="{ option }">
                        <div @click="$emit('select-customer', option)" class="w-full">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-semibold text-gray-800">{{ option.name }}</div>
                                    <div class="text-sm text-gray-600">
                                        {{ option.identity_document_type?.toUpperCase() }}:
                                        {{ option.identity_document || 'Sin documento' }}
                                    </div>
                                </div>
                                <div class="text-xs text-gray-500">
                                    {{ option.email || 'Sin email' }}
                                </div>
                            </div>
                        </div>
                    </template>
                </AutoComplete>
                <div class="flex items-center mt-2 text-xs text-gray-600">
                    <i class="pi pi-info-circle mr-1 text-purple-500"></i>
                    Escriba al menos 2 caracteres para buscar
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="border-t border-gray-200 pt-6">
                <div class="flex justify-between items-center">
                    <Button
                        @click="
                            $emit('update:showCreateCustomerDialog', true);
                            $emit('update:showCustomerDialog', false);
                        "
                        label="Crear Nuevo Cliente"
                        icon="pi pi-plus"
                        severity="success"
                        outlined
                        class="font-semibold"
                    />

                    <Button @click="$emit('update:showCustomerDialog', false)" label="Cancelar" icon="pi pi-times" severity="secondary" outlined />
                </div>
            </div>
        </div>
    </Dialog>

    <!-- Create Customer Dialog -->
    <Dialog
        :visible="props.showCreateCustomerDialog"
        @update:visible="$emit('update:showCreateCustomerDialog', $event)"
        header="Crear Nuevo Cliente"
        :modal="true"
        :style="{ width: '95vw', maxWidth: '500px' }"
        :pt="{
            header: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
            content: 'p-6'
        }"
    >
        <template #header>
            <div class="flex items-center space-x-3">
                <i class="pi pi-user-plus text-xl"></i>
                <span class="text-xl font-bold">Nuevo Cliente</span>
            </div>
        </template>

        <div class="space-y-4 mt-2">
            <!-- Name -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2"> Nombre completo <span class="text-red-500">*</span> </label>
                <InputText v-model="internalNewCustomer.name" placeholder="Nombre completo del cliente" class="w-full py-3 px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl" />
            </div>

            <!-- Identity Document -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                    <Select
                        v-model="internalNewCustomer.identity_document_type"
                        :options="[
                            { label: 'DNI', value: 'dni' },
                            { label: 'RUC', value: 'ruc' },
                            { label: 'Pasaporte', value: 'passport' },
                            { label: 'Otro', value: 'other' }
                        ]"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    />
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-bold text-gray-700 mb-2">Número de documento</label>
                    <InputText v-model="internalNewCustomer.identity_document" placeholder="Número de documento" class="w-full py-3 px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl" />
                </div>
            </div>

            <!-- Email -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <InputText v-model="internalNewCustomer.email" type="email" placeholder="email@ejemplo.com" class="w-full py-3 px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl" />
            </div>

            <!-- Phone -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                <InputText v-model="internalNewCustomer.phone" placeholder="987654321" class="w-full py-3 px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl" />
            </div>

            <!-- Actions -->
            <div class="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                    @click="
                        $emit('update:showCreateCustomerDialog', false);
                        $emit('update:showCustomerDialog', true);
                    "
                    label="Cancelar"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    class="flex-1"
                />
                <Button @click="$emit('create-quick-customer')" label="Crear Cliente" icon="pi pi-check" severity="success" class="flex-1 font-semibold" :loading="props.loading" />
            </div>
        </div>
    </Dialog>
</template>
