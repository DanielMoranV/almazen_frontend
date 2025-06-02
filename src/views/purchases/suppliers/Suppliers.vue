<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const suppliers = ref([]);
const searchQuery = ref('');
const categoryFilter = ref(null);
const displaySupplierDialog = ref(false);
const isEditMode = ref(false);
const selectedSupplier = ref(null);

const supplierForm = ref({
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    category: '',
    paymentTerms: '',
    status: 'active'
});

// Categorías de proveedores
const supplierCategories = [
    { label: 'Todas', value: null },
    { label: 'Materias Primas', value: 'raw_materials' },
    { label: 'Productos Terminados', value: 'finished_products' },
    { label: 'Servicios', value: 'services' },
    { label: 'Logística', value: 'logistics' },
    { label: 'Otros', value: 'others' }
];

// Datos de ejemplo para los proveedores
const mockSuppliers = [
    {
        id: 1,
        name: 'Proveedor Principal S.A.',
        email: 'contacto@proveedorprincipal.com',
        phone: '555-123-4567',
        address: 'Av. Industrial 123, Ciudad',
        taxId: 'PPR123456789',
        category: 'raw_materials',
        paymentTerms: '30 días',
        status: 'active',
        totalOrders: 25,
        lastOrder: '2025-06-01'
    },
    {
        id: 2,
        name: 'Distribuidora Mayorista',
        email: 'ventas@distribuidoramayorista.com',
        phone: '555-987-6543',
        address: 'Calle Comercial 456, Ciudad',
        taxId: 'DMY987654321',
        category: 'finished_products',
        paymentTerms: '15 días',
        status: 'active',
        totalOrders: 18,
        lastOrder: '2025-05-28'
    },
    {
        id: 3,
        name: 'Transportes Rápidos',
        email: 'info@transportesrapidos.com',
        phone: '555-555-5555',
        address: 'Calle Logística 789, Ciudad',
        taxId: 'TRA891234',
        category: 'logistics',
        paymentTerms: '7 días',
        status: 'active',
        totalOrders: 42,
        lastOrder: '2025-06-02'
    },
    {
        id: 4,
        name: 'Servicios Técnicos S.A.',
        email: 'soporte@serviciotecnico.com',
        phone: '555-111-2222',
        address: 'Av. Tecnológica 567, Ciudad',
        taxId: 'STE123789456',
        category: 'services',
        paymentTerms: 'Inmediato',
        status: 'inactive',
        totalOrders: 8,
        lastOrder: '2025-04-15'
    },
    {
        id: 5,
        name: 'Importadora Internacional',
        email: 'importaciones@importadoraint.com',
        phone: '555-444-3333',
        address: 'Calle Comercio Exterior 321, Ciudad',
        taxId: 'IIN765432',
        category: 'finished_products',
        paymentTerms: '45 días',
        status: 'active',
        totalOrders: 15,
        lastOrder: '2025-05-20'
    }
];

onMounted(() => {
    loadSuppliers();
});

const loadSuppliers = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        suppliers.value = mockSuppliers;
        loading.value = false;
    }, 500);
};

const openNewSupplierDialog = () => {
    isEditMode.value = false;
    supplierForm.value = {
        id: null,
        name: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        category: '',
        paymentTerms: '',
        status: 'active'
    };
    displaySupplierDialog.value = true;
};

const openEditSupplierDialog = (supplier) => {
    isEditMode.value = true;
    selectedSupplier.value = supplier;
    supplierForm.value = { ...supplier };
    displaySupplierDialog.value = true;
};

const saveSupplier = () => {
    if (!supplierForm.value.name || !supplierForm.value.email || !supplierForm.value.category) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Nombre, correo y categoría son campos obligatorios',
            life: 3000
        });
        return;
    }
    
    loading.value = true;
    
    // Simulación de guardado
    setTimeout(() => {
        if (isEditMode.value) {
            // Actualizar proveedor existente
            const index = suppliers.value.findIndex(s => s.id === supplierForm.value.id);
            if (index !== -1) {
                suppliers.value[index] = { ...supplierForm.value };
            }
            
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Proveedor actualizado correctamente',
                life: 3000
            });
        } else {
            // Crear nuevo proveedor
            const newSupplier = {
                ...supplierForm.value,
                id: suppliers.value.length + 1,
                totalOrders: 0,
                lastOrder: '-'
            };
            
            suppliers.value.unshift(newSupplier);
            
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Proveedor creado correctamente',
                life: 3000
            });
        }
        
        displaySupplierDialog.value = false;
        loading.value = false;
    }, 1000);
};

const viewSupplierDetails = (supplier) => {
    // Navegar a la página de detalles del proveedor
    router.push(`/purchases/suppliers/${supplier.id}`);
};

const createPurchaseOrder = (supplier, event) => {
    event.stopPropagation();
    
    if (supplier.status !== 'active') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se pueden crear órdenes para proveedores inactivos',
            life: 3000
        });
        return;
    }
    
    // Navegar a la página de creación de orden con el proveedor preseleccionado
    router.push({
        path: '/purchases/orders/new',
        query: { supplierId: supplier.id }
    });
};

const filteredSuppliers = computed(() => {
    let result = suppliers.value;
    
    // Filtrar por búsqueda
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(supplier => 
            supplier.name.toLowerCase().includes(query) || 
            supplier.email.toLowerCase().includes(query) ||
            supplier.taxId.toLowerCase().includes(query)
        );
    }
    
    // Filtrar por categoría
    if (categoryFilter.value) {
        result = result.filter(supplier => supplier.category === categoryFilter.value);
    }
    
    return result;
});

const getCategoryLabel = (category) => {
    const found = supplierCategories.find(c => c.value === category);
    return found ? found.label : category;
};

const getStatusClass = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
};

const getStatusLabel = (status) => {
    return status === 'active' ? 'Activo' : 'Inactivo';
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0">Proveedores</h5>
                    <div class="mt-3 md:mt-0">
                        <button class="p-button p-component" @click="openNewSupplierDialog">
                            <i class="pi pi-plus mr-2"></i>
                            <span class="p-button-label">Nuevo Proveedor</span>
                        </button>
                    </div>
                </div>
                
                <div class="flex flex-column md:flex-row justify-content-between mt-4">
                    <div class="p-input-icon-left mb-3 md:mb-0 w-full md:w-4">
                        <i class="pi pi-search"></i>
                        <input type="text" v-model="searchQuery" class="p-inputtext p-component w-full" placeholder="Buscar proveedor..." />
                    </div>
                    
                    <div class="flex align-items-center">
                        <label for="category-filter" class="mr-2">Categoría:</label>
                        <select id="category-filter" v-model="categoryFilter" class="p-inputtext p-component">
                            <option v-for="option in supplierCategories" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                </div>
                
                <div v-if="loading" class="flex justify-content-center mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
                
                <div v-else-if="filteredSuppliers.length === 0" class="text-center p-5">
                    <i class="pi pi-building text-4xl text-500 mb-3"></i>
                    <p>No hay proveedores que coincidan con los filtros</p>
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
                                <th class="text-left p-3 border-bottom-1 surface-border">Categoría</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Términos de Pago</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Órdenes</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Estado</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="supplier in filteredSuppliers" :key="supplier.id" class="cursor-pointer hover:surface-200" @click="viewSupplierDetails(supplier)">
                                <td class="p-3 border-bottom-1 surface-border">{{ supplier.id }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ supplier.name }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ supplier.email }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ supplier.phone }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ supplier.taxId }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ getCategoryLabel(supplier.category) }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ supplier.paymentTerms }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ supplier.totalOrders }}</td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getStatusClass(supplier.status)">
                                        {{ getStatusLabel(supplier.status) }}
                                    </span>
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <div class="flex justify-content-center">
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="viewSupplierDetails(supplier)">
                                            <i class="pi pi-eye"></i>
                                        </button>
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="openEditSupplierDialog(supplier)">
                                            <i class="pi pi-pencil"></i>
                                        </button>
                                        <button 
                                            class="p-button p-component p-button-icon-only p-button-rounded p-button-text"
                                            :class="{'p-button-success': supplier.status === 'active'}"
                                            @click.stop="createPurchaseOrder(supplier, $event)"
                                            :disabled="supplier.status !== 'active'"
                                        >
                                            <i class="pi pi-shopping-cart"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Diálogo de Proveedor -->
        <div v-if="displaySupplierDialog" class="fixed top-0 left-0 w-full h-full flex justify-content-center align-items-center bg-black-alpha-40" style="z-index: 1000;">
            <div class="surface-card p-4 shadow-2 border-round w-full md:w-8">
                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">{{ isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h5>
                    <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click="displaySupplierDialog = false">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                
                <div class="grid formgrid">
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="name" class="block mb-2">Nombre*</label>
                        <input id="name" type="text" v-model="supplierForm.name" class="p-inputtext p-component w-full" />
                    </div>
                    
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="email" class="block mb-2">Email*</label>
                        <input id="email" type="email" v-model="supplierForm.email" class="p-inputtext p-component w-full" />
                    </div>
                    
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="phone" class="block mb-2">Teléfono</label>
                        <input id="phone" type="text" v-model="supplierForm.phone" class="p-inputtext p-component w-full" />
                    </div>
                    
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="taxId" class="block mb-2">ID Fiscal</label>
                        <input id="taxId" type="text" v-model="supplierForm.taxId" class="p-inputtext p-component w-full" />
                    </div>
                    
                    <div class="field col-12 mb-4">
                        <label for="address" class="block mb-2">Dirección</label>
                        <textarea id="address" v-model="supplierForm.address" rows="3" class="p-inputtextarea p-component w-full"></textarea>
                    </div>
                    
                    <div class="field col-12 md:col-4 mb-4">
                        <label for="category" class="block mb-2">Categoría*</label>
                        <select id="category" v-model="supplierForm.category" class="p-inputtext p-component w-full">
                            <option v-for="option in supplierCategories.filter(c => c.value)" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="field col-12 md:col-4 mb-4">
                        <label for="paymentTerms" class="block mb-2">Términos de Pago</label>
                        <input id="paymentTerms" type="text" v-model="supplierForm.paymentTerms" class="p-inputtext p-component w-full" />
                    </div>
                    
                    <div class="field col-12 md:col-4 mb-4">
                        <label for="status" class="block mb-2">Estado</label>
                        <select id="status" v-model="supplierForm.status" class="p-inputtext p-component w-full">
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex justify-content-end">
                    <button class="p-button p-component p-button-secondary mr-2" @click="displaySupplierDialog = false">
                        <span class="p-button-label">Cancelar</span>
                    </button>
                    <button class="p-button p-component" :disabled="loading" @click="saveSupplier">
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
