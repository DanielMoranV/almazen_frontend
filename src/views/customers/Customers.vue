<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const customers = ref([]);
const searchQuery = ref('');
const displayCustomerDialog = ref(false);
const isEditMode = ref(false);
const selectedCustomer = ref(null);

const customerForm = ref({
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    type: 'individual',
    creditLimit: 0,
    status: 'active'
});

// Datos de ejemplo para los clientes
const mockCustomers = [
    {
        id: 1,
        name: 'Empresa ABC',
        email: 'contacto@empresaabc.com',
        phone: '555-123-4567',
        address: 'Av. Principal 123, Ciudad',
        taxId: 'ABC123456789',
        type: 'business',
        creditLimit: 10000,
        status: 'active',
        totalPurchases: 25600,
        lastPurchase: '2025-06-01'
    },
    {
        id: 2,
        name: 'Distribuidora XYZ',
        email: 'ventas@distribuidoraxyz.com',
        phone: '555-987-6543',
        address: 'Calle Comercial 456, Ciudad',
        taxId: 'XYZ987654321',
        type: 'business',
        creditLimit: 15000,
        status: 'active',
        totalPurchases: 42300,
        lastPurchase: '2025-05-28'
    },
    {
        id: 3,
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '555-555-5555',
        address: 'Calle Residencial 789, Ciudad',
        taxId: 'PERJ891234',
        type: 'individual',
        creditLimit: 2000,
        status: 'active',
        totalPurchases: 3500,
        lastPurchase: '2025-06-02'
    },
    {
        id: 4,
        name: 'Comercial 123',
        email: 'info@comercial123.com',
        phone: '555-111-2222',
        address: 'Av. Industrial 567, Ciudad',
        taxId: 'COM123789456',
        type: 'business',
        creditLimit: 8000,
        status: 'inactive',
        totalPurchases: 12800,
        lastPurchase: '2025-04-15'
    },
    {
        id: 5,
        name: 'María González',
        email: 'maria.gonzalez@email.com',
        phone: '555-444-3333',
        address: 'Calle Central 321, Ciudad',
        taxId: 'GONM765432',
        type: 'individual',
        creditLimit: 1500,
        status: 'active',
        totalPurchases: 2700,
        lastPurchase: '2025-05-20'
    }
];

onMounted(() => {
    loadCustomers();
});

const loadCustomers = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        customers.value = mockCustomers;
        loading.value = false;
    }, 500);
};

const openNewCustomerDialog = () => {
    isEditMode.value = false;
    customerForm.value = {
        id: null,
        name: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        type: 'individual',
        creditLimit: 0,
        status: 'active'
    };
    displayCustomerDialog.value = true;
};

const openEditCustomerDialog = (customer) => {
    isEditMode.value = true;
    selectedCustomer.value = customer;
    customerForm.value = { ...customer };
    displayCustomerDialog.value = true;
};

const saveCustomer = () => {
    if (!customerForm.value.name || !customerForm.value.email) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Nombre y correo son campos obligatorios',
            life: 3000
        });
        return;
    }

    loading.value = true;

    // Simulación de guardado
    setTimeout(() => {
        if (isEditMode.value) {
            // Actualizar cliente existente
            const index = customers.value.findIndex((c) => c.id === customerForm.value.id);
            if (index !== -1) {
                customers.value[index] = { ...customerForm.value };
            }

            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Cliente actualizado correctamente',
                life: 3000
            });
        } else {
            // Crear nuevo cliente
            const newCustomer = {
                ...customerForm.value,
                id: customers.value.length + 1,
                totalPurchases: 0,
                lastPurchase: '-'
            };

            customers.value.unshift(newCustomer);

            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Cliente creado correctamente',
                life: 3000
            });
        }

        displayCustomerDialog.value = false;
        loading.value = false;
    }, 1000);
};

const viewCustomerDetails = (customer) => {
    // Navegar a la página de detalles del cliente
    router.push(`/customers/${customer.id}`);
};

const filteredCustomers = computed(() => {
    if (!searchQuery.value) return customers.value;

    const query = searchQuery.value.toLowerCase();
    return customers.value.filter((customer) => customer.name.toLowerCase().includes(query) || customer.email.toLowerCase().includes(query) || customer.taxId.toLowerCase().includes(query));
});

const getCustomerTypeLabel = (type) => {
    return type === 'business' ? 'Empresa' : 'Individual';
};

const getStatusClass = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
};

const getStatusLabel = (status) => {
    return status === 'active' ? 'Activo' : 'Inactivo';
};

const formatCurrency = (value) => {
    return value ? `$${value.toLocaleString()}` : '-';
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0">Clientes</h5>
                    <div class="mt-3 md:mt-0">
                        <button class="p-button p-component" @click="openNewCustomerDialog">
                            <i class="pi pi-plus mr-2"></i>
                            <span class="p-button-label">Nuevo Cliente</span>
                        </button>
                    </div>
                </div>

                <div class="flex justify-content-between mt-4">
                    <div class="p-input-icon-left w-full md:w-4">
                        <i class="pi pi-search"></i>
                        <input type="text" v-model="searchQuery" class="p-inputtext p-component w-full" placeholder="Buscar cliente..." />
                    </div>
                </div>

                <div v-if="loading" class="flex justify-content-center mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>

                <div v-else-if="customers.length === 0" class="text-center p-5">
                    <i class="pi pi-users text-4xl text-500 mb-3"></i>
                    <p>No hay clientes registrados</p>
                </div>

                <div v-else class="overflow-x-auto mt-4">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left p-3 border-bottom-1 surface-border">ID</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Nombre</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Email</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Teléfono</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">ID Fiscal</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Tipo</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Límite Crédito</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Total Compras</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Estado</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="customer in filteredCustomers" :key="customer.id" class="cursor-pointer hover:surface-200" @click="viewCustomerDetails(customer)">
                                <td class="p-3 border-bottom-1 surface-border">{{ customer.id }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ customer.name }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ customer.email }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ customer.phone }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ customer.taxId }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ getCustomerTypeLabel(customer.type) }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(customer.creditLimit) }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(customer.totalPurchases) }}</td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getStatusClass(customer.status)">
                                        {{ getStatusLabel(customer.status) }}
                                    </span>
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <div class="flex justify-content-center">
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="viewCustomerDetails(customer)">
                                            <i class="pi pi-eye"></i>
                                        </button>
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click.stop="openEditCustomerDialog(customer)">
                                            <i class="pi pi-pencil"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Diálogo de Cliente -->
        <div v-if="displayCustomerDialog" class="fixed top-0 left-0 w-full h-full flex justify-content-center align-items-center bg-black-alpha-40" style="z-index: 1000">
            <div class="surface-card p-4 shadow-2 border-round w-full md:w-8">
                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">{{ isEditMode ? 'Editar Cliente' : 'Nuevo Cliente' }}</h5>
                    <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click="displayCustomerDialog = false">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <div class="grid formgrid">
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="name" class="block mb-2">Nombre*</label>
                        <input id="name" type="text" v-model="customerForm.name" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field col-12 md:col-6 mb-4">
                        <label for="email" class="block mb-2">Email*</label>
                        <input id="email" type="email" v-model="customerForm.email" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field col-12 md:col-6 mb-4">
                        <label for="phone" class="block mb-2">Teléfono</label>
                        <input id="phone" type="text" v-model="customerForm.phone" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field col-12 md:col-6 mb-4">
                        <label for="taxId" class="block mb-2">ID Fiscal</label>
                        <input id="taxId" type="text" v-model="customerForm.taxId" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field col-12 mb-4">
                        <label for="address" class="block mb-2">Dirección</label>
                        <textarea id="address" v-model="customerForm.address" rows="3" class="p-inputtextarea p-component w-full"></textarea>
                    </div>

                    <div class="field col-12 md:col-4 mb-4">
                        <label for="type" class="block mb-2">Tipo</label>
                        <select id="type" v-model="customerForm.type" class="p-inputtext p-component w-full">
                            <option value="individual">Individual</option>
                            <option value="business">Empresa</option>
                        </select>
                    </div>

                    <div class="field col-12 md:col-4 mb-4">
                        <label for="creditLimit" class="block mb-2">Límite de Crédito</label>
                        <div class="p-inputgroup">
                            <span class="p-inputgroup-addon">$</span>
                            <input id="creditLimit" type="number" v-model="customerForm.creditLimit" class="p-inputtext p-component w-full" />
                        </div>
                    </div>

                    <div class="field col-12 md:col-4 mb-4">
                        <label for="status" class="block mb-2">Estado</label>
                        <select id="status" v-model="customerForm.status" class="p-inputtext p-component w-full">
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                    </div>
                </div>

                <div class="flex justify-content-end">
                    <button class="p-button p-component p-button-secondary mr-2" @click="displayCustomerDialog = false">
                        <span class="p-button-label">Cancelar</span>
                    </button>
                    <button class="p-button p-component" :disabled="loading" @click="saveCustomer">
                        <i v-if="loading" class="pi pi-spin pi-spinner mr-2"></i>
                        <span class="p-button-label">Guardar</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.overflow-x-auto {
    overflow-x: auto;
}
</style>
