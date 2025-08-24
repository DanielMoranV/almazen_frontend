<script setup>
import { defineEmits, defineProps, ref, watch, computed } from 'vue';
import { useCustomersStore } from '@/stores/customersStore';
import { useToast } from 'primevue/usetoast';
import { searchCustomers } from '@/api';
import cache from '@/utils/cache.js';

const props = defineProps({
    showCustomerDialog: Boolean,
    showCreateCustomerDialog: Boolean,
    customerSearch: String,
    customerResults: Array,
    isSearchingCustomers: Boolean,
    newCustomer: Object,
    loading: Boolean,
    voucherType: String,
    cartTotal: Number
});

const emit = defineEmits(['update:showCustomerDialog', 'update:showCreateCustomerDialog', 'update:customerSearch', 'update:newCustomer', 'search-customers', 'select-customer', 'create-quick-customer']);

const customersStore = useCustomersStore();
const toast = useToast();

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

// Validación de DNI/RUC
const isDni = (text) => /^\d{8}$/.test(text?.trim());
const isRuc = (text) => /^\d{11}$/.test(text?.trim());

const canLookupDocument = computed(() => {
    const search = internalCustomerSearch.value?.trim();
    return isDni(search) || isRuc(search);
});

const getDocumentType = (text) => {
    if (isDni(text)) return 'dni';
    if (isRuc(text)) return 'ruc';
    return null;
};

// Estado de búsqueda automática
const isLoadingDocumentData = computed(() => customersStore.isLoadingDocumentLookup);

// Búsqueda automática de documento
const lookupDocumentData = async (document, type) => {
    const payload = { document: document.trim(), type };
    
    await customersStore.lookupDocumentData(payload);
    
    if (customersStore.documentLookupSuccess) {
        mapDocumentDataToNewCustomer(customersStore.documentLookupData, type);
        toast.add({
            severity: 'success',
            summary: 'Datos encontrados',
            detail: customersStore.documentLookupMessage,
            life: 3000
        });
    } else {
        toast.add({
            severity: 'warn',
            summary: 'No se encontraron datos',
            detail: customersStore.documentLookupMessage || 'No se pudo obtener información del documento',
            life: 4000
        });
    }
};

// Mapear datos de la API a los campos del nuevo cliente
const mapDocumentDataToNewCustomer = (data, documentType) => {
    if (!data) return;
    
    if (documentType === 'dni') {
        // Mapeo para DNI (RENIEC)
        internalNewCustomer.value.name = data.nombre_completo || '';
        internalNewCustomer.value.identity_document_type = 'dni';
    } else if (documentType === 'ruc') {
        // Mapeo para RUC (SUNAT)
        internalNewCustomer.value.name = data.razon_social || '';
        internalNewCustomer.value.identity_document_type = 'ruc';
    }
    
    customersStore.clearDocumentData();
};

// Función para crear cliente con búsqueda automática
const createClientWithLookup = async () => {
    const search = internalCustomerSearch.value?.trim();
    const documentType = getDocumentType(search);
    
    if (documentType) {
        // Si es un documento válido, buscar datos automáticamente
        internalNewCustomer.value.identity_document = search;
        internalNewCustomer.value.identity_document_type = documentType;
        
        await lookupDocumentData(search, documentType);
    } else {
        // Si no es un documento válido, usar el texto como nombre
        internalNewCustomer.value.name = search;
    }
    
    // Abrir el diálogo de crear cliente
    emit('update:showCreateCustomerDialog', true);
    emit('update:showCustomerDialog', false);
};

// Constante para el cache del cliente anónimo
const ANONYMOUS_CUSTOMER_CACHE_KEY = 'pos_anonymous_customer';

// Función para seleccionar cliente anónimo
const selectAnonymousCustomer = async () => {
    try {
        // Primero verificar si tenemos datos en cache
        let anonymousCustomer = cache.getItem(ANONYMOUS_CUSTOMER_CACHE_KEY);
        
        if (anonymousCustomer) {
            // Si existe en cache, usar directamente
            emit('select-customer', anonymousCustomer);
            return;
        }
        
        // Si no existe en cache, hacer consulta al backend
        const response = await searchCustomers('Cliente Anónimo');
        const customers = response.data || [];
        
        anonymousCustomer = customers.find(customer => 
            customer.name.toLowerCase().includes('cliente anónimo') || 
            customer.name.toLowerCase().includes('anonimo')
        );
        
        if (anonymousCustomer) {
            // Guardar en cache para futuras consultas
            cache.setItem(ANONYMOUS_CUSTOMER_CACHE_KEY, anonymousCustomer);
            emit('select-customer', anonymousCustomer);
        } else {
            // Si no se encuentra, mostrar un mensaje de error
            toast.add({
                severity: 'error',
                summary: 'Cliente no encontrado',
                detail: 'No se pudo encontrar el cliente anónimo. Verifique que existe en el sistema.',
                life: 4000
            });
        }
    } catch (error) {
        console.error('Error searching anonymous customer:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al buscar cliente anónimo',
            life: 4000
        });
    }
};
</script>

<template>
    <!-- Customer Selection Dialog -->
    <Dialog
        :visible="props.showCustomerDialog"
        @update:visible="$emit('update:showCustomerDialog', $event)"
        header="Seleccionar Cliente"
        :modal="true"
        :style="{ width: '98vw', maxWidth: '600px' }"
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
                        input: 'w-full py-2 sm:py-3 px-3 sm:px-4 text-base border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl touch-manipulation',
                        panel: 'bg-white border border-gray-300 rounded-lg shadow-lg mt-1',
                        list: 'max-h-60 overflow-auto p-2',
                        item: 'p-3 hover:bg-purple-50 rounded-lg cursor-pointer border-b border-gray-100 touch-manipulation'
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
                    <span v-if="!canLookupDocument">Escriba al menos 2 caracteres para buscar</span>
                    <span v-else class="text-blue-600 font-medium">
                        <i class="pi pi-search mr-1"></i>
                        {{ isDni(internalCustomerSearch) ? 'DNI detectado' : 'RUC detectado' }} - Se puede buscar automáticamente
                    </span>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="border-t border-gray-200 pt-6">
                <!-- Cliente Anónimo -->
                <div class="mb-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                                <i class="pi pi-user-minus text-white"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-800">Cliente Anónimo</h4>
                                <p class="text-sm text-gray-600">Para clientes que no quieren dar sus datos</p>
                            </div>
                        </div>
                        <Button
                            @click="selectAnonymousCustomer"
                            label="Seleccionar"
                            icon="pi pi-check"
                            severity="warning"
                            class="font-semibold touch-manipulation py-2 px-3"
                        />
                    </div>
                    <div class="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded-lg">
                        <i class="pi pi-info-circle mr-1"></i>
                        <strong>Restricciones:</strong> Solo para tickets o boletas menores a S/700
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:justify-between items-center">
                    <Button
                        @click="createClientWithLookup"
                        :label="canLookupDocument ? (isDni(internalCustomerSearch) ? 'Crear Cliente con DNI' : 'Crear Cliente con RUC') : 'Crear Nuevo Cliente'"
                        :icon="canLookupDocument ? 'pi pi-search' : 'pi pi-plus'"
                        :severity="canLookupDocument ? 'info' : 'success'"
                        :outlined="!canLookupDocument"
                        :loading="isLoadingDocumentData"
                        class="font-semibold touch-manipulation py-2 px-3 w-full sm:w-auto"
                    />

                    <Button @click="$emit('update:showCustomerDialog', false)" label="Cancelar" icon="pi pi-times" severity="secondary" outlined class="touch-manipulation py-2 px-3 w-full sm:w-auto" />
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
        :style="{ width: '98vw', maxWidth: '500px' }"
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
                <InputText v-model="internalNewCustomer.name" placeholder="Nombre completo del cliente" class="w-full py-2 sm:py-3 px-3 sm:px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl touch-manipulation" />
            </div>

            <!-- Identity Document -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
                <div class="sm:col-span-2">
                    <label class="block text-sm font-bold text-gray-700 mb-2">Número de documento</label>
                    <div class="flex gap-2">
                        <InputText 
                            v-model="internalNewCustomer.identity_document" 
                            placeholder="Número de documento" 
                            class="flex-1 py-2 sm:py-3 px-3 sm:px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl touch-manipulation" 
                        />
                        <Button 
                            v-if="isDni(internalNewCustomer.identity_document) || isRuc(internalNewCustomer.identity_document)"
                            @click="lookupDocumentData(internalNewCustomer.identity_document, getDocumentType(internalNewCustomer.identity_document))"
                            icon="pi pi-search"
                            :loading="isLoadingDocumentData"
                            severity="info"
                            class="px-3"
                            v-tooltip.top="'Buscar datos automáticamente'"
                        />
                    </div>
                    <small v-if="isDni(internalNewCustomer.identity_document) || isRuc(internalNewCustomer.identity_document)" class="text-blue-600 text-xs mt-1 block">
                        💡 Haz clic en el botón de búsqueda para llenar automáticamente
                    </small>
                </div>
            </div>

            <!-- Email -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <InputText v-model="internalNewCustomer.email" type="email" placeholder="email@ejemplo.com" class="w-full py-2 sm:py-3 px-3 sm:px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl touch-manipulation" />
            </div>

            <!-- Phone -->
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                <InputText v-model="internalNewCustomer.phone" placeholder="987654321" class="w-full py-2 sm:py-3 px-3 sm:px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl touch-manipulation" />
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <Button
                    @click="
                        $emit('update:showCreateCustomerDialog', false);
                        $emit('update:showCustomerDialog', true);
                    "
                    label="Cancelar"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    class="flex-1 touch-manipulation py-2 px-3"
                />
                <Button @click="$emit('create-quick-customer')" label="Crear Cliente" icon="pi pi-check" severity="success" class="flex-1 font-semibold touch-manipulation py-2 px-3" :loading="props.loading" />
            </div>
        </div>
    </Dialog>
</template>
