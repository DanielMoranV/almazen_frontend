<script setup>
import { useDiscountCodesStore } from '@/stores/discountCodesStore';
import { usePromotionsStore } from '@/stores/promotionsStore';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import DiscountCodeForm from './componentsDiscounts/DiscountCodeForm.vue';
import DiscountCodesList from './componentsDiscounts/DiscountCodesList.vue';
import PromotionFormDialog from './componentsDiscounts/PromotionFormDialog.vue';
import PromotionsList from './componentsDiscounts/PromotionsList.vue';

const toast = useToast();
const discountCodesStore = useDiscountCodesStore();
const promotionsStore = usePromotionsStore();

// UI State
const activeTab = ref(0);
const searchQuery = ref('');
const showFormDialog = ref(false);
const showPromotionDialog = ref(false);

// Discount Codes State
const selectedStatus = ref('all');
const selectedType = ref('all');
const editingCode = ref(null);

// Promotions State
const selectedPromoChannel = ref(null);
const editingPromotion = ref(null);

const statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' }
];

const typeOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Porcentaje', value: 'percentage' },
    { label: 'Monto Fijo', value: 'fixed' }
];

const channelOptions = [
    { label: 'Todos los canales', value: null },
    { label: 'Web', value: 'web' },
    { label: 'POS', value: 'pos' },
    { label: 'Instagram', value: 'instagram' }
];

const loading = computed(() => {
    return activeTab.value === 0 ? discountCodesStore.loading : promotionsStore.loading;
});

// -- Discount Codes Filtering --
const filteredCodes = computed(() => {
    let codes = (discountCodesStore.discountCodes || []).filter(c => c);

    if (searchQuery.value && activeTab.value === 0) {
        const query = searchQuery.value.toLowerCase();
        codes = codes.filter(
            (code) =>
                code.code.toLowerCase().includes(query) ||
                code.name.toLowerCase().includes(query) ||
                code.description?.toLowerCase().includes(query)
        );
    }

    if (selectedStatus.value === 'active') {
        codes = codes.filter((code) => code.is_active);
    } else if (selectedStatus.value === 'inactive') {
        codes = codes.filter((code) => !code.is_active);
    }

    if (selectedType.value !== 'all') {
        codes = codes.filter((code) => code.discount_type === selectedType.value);
    }

    return codes;
});

// -- Promotions Filtering --
const filteredPromotions = computed(() => {
    let promos = (promotionsStore.promotions || []).filter(p => p);

    if (searchQuery.value && activeTab.value === 1) {
        const query = searchQuery.value.toLowerCase();
        promos = promos.filter(
             (p) => 
                p.name.toLowerCase().includes(query) || 
                (p.product?.name && p.product.name.toLowerCase().includes(query))
        );
    }

    if (selectedPromoChannel.value) {
        promos = promos.filter(p => p.channel === selectedPromoChannel.value);
    }

    return promos;
});

const loadDiscountCodes = async () => {
    try {
        await discountCodesStore.fetchDiscountCodes();
    } catch (error) {
        console.error('[DiscountCodes] Error:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar códigos', life: 4000 });
    }
};

const loadPromotions = async () => {
    try {
        await promotionsStore.fetchPromotions();
    } catch (error) {
        console.error('[Promotions] Error:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar promociones', life: 4000 });
    }
};

// Initial Load and Tab Change
onMounted(async () => {
    await loadDiscountCodes();
    // Pre-fetch promotions too or wait for tab switch? Let's fetch both to be ready or lazy load.
    await loadPromotions(); 
});

watch(activeTab, (val) => {
    searchQuery.value = ''; // Clear search on tab switch
    if (val === 0) loadDiscountCodes();
    else loadPromotions();
});

// -- Discount Code Handlers --
const openNewCodeDialog = () => { editingCode.value = null; showFormDialog.value = true; };
const openEditDialog = (code) => { editingCode.value = code; showFormDialog.value = true; };
const closeFormDialog = () => { showFormDialog.value = false; editingCode.value = null; };
const handleCodeSaved = async () => { await loadDiscountCodes(); closeFormDialog(); };

// -- Promotion Handlers --
const openNewPromoDialog = () => { editingPromotion.value = null; showPromotionDialog.value = true; };
const openEditPromoDialog = (promo) => { editingPromotion.value = promo; showPromotionDialog.value = true; };
const closePromoDialog = () => { showPromotionDialog.value = false; editingPromotion.value = null; };
const handlePromoSaved = async () => { await loadPromotions(); closePromoDialog(); };

const viewStats = (id) => {
    toast.add({ severity: 'info', summary: 'Próximamente', detail: 'Estadísticas pronto', life: 3000 });
};
</script>

<template>
    <div class="discount-codes-page">
        <Toast />

        <!-- Page Header -->
        <div class="page-header">
            <div class="header-content">
                <div class="title-section">
                    <h1 class="page-title">
                        <i class="pi pi-tags"></i>
                        Gestión de Descuentos y Promociones
                    </h1>
                    <p class="page-subtitle">Administra códigos de cupón y precios promocionales</p>
                </div>
            </div>
        </div>

        <!-- Content Container -->
        <div class="content-container">
            <TabView v-model:activeIndex="activeTab">
                <!-- CUPONES TAB -->
                <TabPanel header="Códigos de Descuento">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-container">
                                <IconField>
                                    <InputIcon class="pi pi-search" />
                                    <InputText v-model="searchQuery" placeholder="Buscar códigos..." class="search-input" />
                                </IconField>
                            </div>

                            <div class="filter-container">
                                <Select v-model="selectedStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Estado" class="filter-select" />
                                <Select v-model="selectedType" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Tipo" class="filter-select" />
                            </div>
                        </div>

                        <div class="toolbar-right">
                            <Button icon="pi pi-refresh" label="Actualizar" severity="secondary" @click="loadDiscountCodes" :loading="loading" outlined />
                            <Button icon="pi pi-plus" label="Nuevo Código" severity="success" @click="openNewCodeDialog" />
                        </div>
                    </div>

                    <DiscountCodesList :codes="filteredCodes" :loading="loading" @edit="openEditDialog" @view-stats="viewStats" @refresh="loadDiscountCodes" />
                </TabPanel>

                <!-- PROMOCIONES TAB -->
                <TabPanel header="Precios Promocionales">
                     <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-container">
                                <IconField>
                                    <InputIcon class="pi pi-search" />
                                    <InputText v-model="searchQuery" placeholder="Buscar promociones..." class="search-input" />
                                </IconField>
                            </div>

                            <div class="filter-container">
                                <Select v-model="selectedPromoChannel" :options="channelOptions" optionLabel="label" optionValue="value" placeholder="Filtrar por Canal" class="filter-select" showClear />
                            </div>
                        </div>

                        <div class="toolbar-right">
                            <Button icon="pi pi-refresh" label="Actualizar" severity="secondary" @click="loadPromotions" :loading="loading" outlined />
                            <Button icon="pi pi-plus" label="Nueva Promoción" severity="success" @click="openNewPromoDialog" />
                        </div>
                    </div>

                    <PromotionsList :promotions="filteredPromotions" :loading="loading" @edit="openEditPromoDialog" @refresh="loadPromotions" />
                </TabPanel>
            </TabView>
        </div>

        <!-- Form Dialogs -->
        <Dialog v-model:visible="showFormDialog" :header="editingCode ? 'Editar Código de Descuento' : 'Nuevo Código de Descuento'" modal :style="{ width: '900px' }" :closable="true">
            <DiscountCodeForm :code="editingCode" :visible="showFormDialog" @close="closeFormDialog" @saved="handleCodeSaved" />
        </Dialog>

        <Dialog v-model:visible="showPromotionDialog" :header="editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'" modal :style="{ width: '700px' }" :closable="true">
            <PromotionFormDialog :promotion="editingPromotion" :visible="showPromotionDialog" @close="closePromoDialog" @saved="handlePromoSaved" />
        </Dialog>
    </div>
</template>

<style scoped>
.discount-codes-page {
    @apply flex flex-col gap-6 p-6 min-h-screen;
}

/* Page Header */
.page-header {
    @apply relative overflow-hidden mb-6 rounded-xl;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%);
    padding: 1.5rem;
    box-shadow:
        0 4px 12px -2px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.05);
}

.header-content {
    @apply relative z-10;
}

.title-section {
    @apply text-center;
}

.page-title {
    @apply flex items-center justify-center gap-2 text-2xl font-bold text-white mb-1;
}

.page-title i {
    @apply text-2xl;
}

.page-subtitle {
    @apply text-white/90 text-sm;
}

/* Content Container */
.content-container {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-6;
}

/* Tabs Styling overrides */
:deep(.p-tabview-nav-container) {
    @apply mb-4;
}

:deep(.p-tabview-panels) {
    @apply p-0;
}

/* Toolbar */
.toolbar {
    @apply flex justify-between items-center gap-4 flex-wrap mb-4 px-2;
}

.toolbar-left {
    @apply flex items-center gap-4 flex-wrap flex-1;
}

.toolbar-right {
    @apply flex gap-2;
}

.search-container {
    @apply min-w-64;
}

.search-input {
    @apply w-full;
}

.filter-container {
    @apply flex gap-2;
}

.filter-select {
    @apply min-w-40;
}

/* Responsive */
@media (max-width: 768px) {
    .discount-codes-page {
        @apply p-4;
    }

    .toolbar {
        @apply flex-col items-stretch;
    }

    .toolbar-left {
        @apply flex-col w-full;
    }

    .search-container {
        @apply w-full min-w-0;
    }

    .filter-container {
        @apply w-full;
    }

    .filter-select {
        @apply flex-1 min-w-0;
    }

    .toolbar-right {
        @apply w-full;
    }

    .toolbar-right .p-button {
        @apply flex-1;
    }
}
</style>

