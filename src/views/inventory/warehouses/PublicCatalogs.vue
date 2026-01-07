<script setup>
import { usePublicCatalogsStore } from '@/stores/publicCatalogsStore';
import { debounce } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// ====================================================================
// Store, Composables y Estado Local
// ====================================================================
const toast = useToast();
const catalogsStore = usePublicCatalogsStore();

// Desestructuramos el estado y los getters del store con reactividad
const { catalogs, stats, isLoading, currentConfig, currentWarehouse, slugValidation, newlyGeneratedToken } = storeToRefs(catalogsStore);

// Estado local del componente
const searchQuery = ref('');
const configDialog = ref(false);
const tokenManagementDialog = ref(false);
const showNewTokenDialog = ref(false);

const selectedWarehouse = ref(null); // Almacén seleccionado para configurar
const form = ref({}); // Objeto del formulario para la configuración

// ====================================================================
// Lógica de Negocio y Métodos
// ====================================================================

// Carga inicial y actualización de catálogos
onMounted(() => {
    catalogsStore.loadPublicCatalogs();
});

const refreshCatalogs = () => {
    toast.add({ severity: 'info', summary: 'Actualizando', detail: 'Cargando lista de catálogos...', life: 2000 });
    catalogsStore.loadPublicCatalogs();
};

// Filtrado de la tabla
const filteredCatalogs = computed(() => {
    if (!searchQuery.value) {
        return catalogs.value;
    }
    const query = searchQuery.value.toLowerCase();
    return catalogs.value.filter((catalog) => catalog.name.toLowerCase().includes(query) || catalog.public_url_slug?.toLowerCase().includes(query));
});

// Abrir diálogo de configuración
const openConfigDialog = async (warehouse) => {
    selectedWarehouse.value = warehouse;
    await catalogsStore.loadCatalogConfig(warehouse.id);

    // Llenar el formulario con los datos del store (currentConfig y currentWarehouse)
    if (currentConfig.value && currentWarehouse.value) {
        console.log('openConfigDialog - currentWarehouse:', currentWarehouse.value);
        console.log('openConfigDialog - currentConfig:', currentConfig.value);
        
        form.value = {
            is_public_visible: Boolean(currentWarehouse.value.is_public_visible),
            public_url_slug: currentWarehouse.value.public_url_slug || '',
            require_access_token: Boolean(currentWarehouse.value.require_access_token), // Assuming the API returns 'require_access_token' or 'requires_token'. Let's check consistency.
            ...currentConfig.value
        };
        // Fallback for require_access_token if the key matches 'requires_token' in some API versions
        if (currentWarehouse.value.requires_token !== undefined) {
             form.value.require_access_token = Boolean(currentWarehouse.value.requires_token);
        }
        
        console.log('openConfigDialog - form initialized (correction):', form.value);
        configDialog.value = true;
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: catalogsStore.error || 'No se pudo cargar la configuración.', life: 4000 });
    }
};

// Guardar configuración
const saveConfiguration = async () => {
    if (!selectedWarehouse.value) return;

    const payload = {
        is_public_visible: form.value.is_public_visible,
        public_url_slug: form.value.public_url_slug,
        require_access_token: form.value.require_access_token,
        catalog_config: {
            seo_title: form.value.seo_title,
            seo_description: form.value.seo_description,
            header_color: form.value.header_color,
            show_stock_quantity: form.value.show_stock_quantity,
            show_prices: form.value.show_prices,
            allow_quotes: form.value.allow_quotes
        }
    };

    try {
        await catalogsStore.updateCatalogConfig(selectedWarehouse.value.id, payload);
        configDialog.value = false;
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Configuración guardada correctamente.', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error al guardar', detail: catalogsStore.error, life: 5000 });
    }
};

// Verificación de Slug con Debounce
const onSlugInput = debounce(() => {
    if (form.value.public_url_slug) {
        catalogsStore.checkSlugAvailability(form.value.public_url_slug, selectedWarehouse.value?.id);
    }
}, 350);

const useSuggestion = (suggestion) => {
    form.value.public_url_slug = suggestion;
    catalogsStore.checkSlugAvailability(suggestion, selectedWarehouse.value?.id);
};

// --- Gestión de Tokens ---
const openTokenManagementDialog = (warehouse) => {
    selectedWarehouse.value = warehouse;
    tokenManagementDialog.value = true;
};

const handleRegenerateToken = async () => {
    if (!selectedWarehouse.value) return;
    await catalogsStore.regenerateAccessToken(selectedWarehouse.value.id);
    tokenManagementDialog.value = false;
};

const handleRemoveToken = async () => {
    if (!selectedWarehouse.value) return;
    await catalogsStore.removeAccessToken(selectedWarehouse.value.id);
    tokenManagementDialog.value = false;
    toast.add({ severity: 'success', summary: 'Token Eliminado', detail: 'El catálogo ahora es público.', life: 3000 });
};

// ====================================================================
// Watchers (Observadores)
// ====================================================================

// Observador para mostrar el token nuevo
watch(newlyGeneratedToken, (token) => {
    if (token) {
        showNewTokenDialog.value = true;
    }
});

// Limpiar validación de slug cuando se cierra el diálogo
watch(configDialog, (isVisible) => {
    if (!isVisible) {
        catalogsStore.slugValidation.message = '';
        catalogsStore.slugValidation.isAvailable = null;
        catalogsStore.slugValidation.suggestions = [];
    }
});

// ====================================================================
// Funciones Utilitarias
// ====================================================================

const copyToClipboard = async (text, type) => {
    try {
        await navigator.clipboard.writeText(text);
        toast.add({ severity: 'success', summary: 'Copiado', detail: `${type} copiado al portapapeles.`, life: 2000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: `No se pudo copiar el ${type}.`, life: 3000 });
    }
};

const closeNewTokenDialog = () => {
    showNewTokenDialog.value = false;
    catalogsStore.clearNewToken(); // Limpia el token del store
};

const openCatalogInNewTab = (url) => {
    if (url) {
        window.open(formatUrl(url), '_blank');
    }
};

const formatUrl = (url) => {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        return `${window.location.origin}${urlObj.pathname}`;
    } catch (e) {
        return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    }
};
</script>

<template>
    <div class="p-6">
        <!-- Cabecera y Estadísticas -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">Catálogos Públicos</h1>
                <p class="text-gray-500">Gestiona la visibilidad y apariencia de tus tiendas online.</p>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 sm:mt-0">
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-blue-600">{{ stats.total_warehouses }}</div>
                        <div class="text-sm text-gray-500">Almacenes</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-green-600">{{ stats.public_catalogs }}</div>
                        <div class="text-sm text-gray-500">Públicos</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-yellow-600">{{ stats.with_access_token }}</div>
                        <div class="text-sm text-gray-500">Con Token</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-gray-600">{{ stats.private_catalogs }}</div>
                        <div class="text-sm text-gray-500">Privados</div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Filtros y Acciones -->
        <Card class="mb-6">
            <template #content>
                <div class="flex justify-between items-center">
                    <InputText v-model="searchQuery" placeholder="Buscar por nombre o slug..." class="w-1/3" />
                    <Button @click="refreshCatalogs" outlined icon="pi pi-refresh" :loading="isLoading" v-tooltip.left="'Actualizar Lista'" />
                </div>
            </template>
        </Card>

        <!-- Tabla de Catálogos -->
        <DataTable :value="filteredCatalogs" :loading="isLoading" responsiveLayout="scroll" paginator :rows="10">
            <Column field="name" header="Almacén" sortable>
                <template #body="{ data }">
                    <span class="font-semibold">{{ data.name }}</span>
                </template>
            </Column>

            <Column header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.is_public ? 'Visible' : 'Oculto'" :severity="data.is_public ? 'success' : 'secondary'" />
                </template>
            </Column>

            <Column header="URL Pública">
                <template #body="{ data }">
                    <div v-if="data.is_public && data.urls.public_url" class="flex items-center gap-2">
                        <a :href="formatUrl(data.urls.public_url)" target="_blank" class="text-blue-600 hover:underline">{{ formatUrl(data.urls.public_url) }}</a>
                        <Button icon="pi pi-copy" text rounded @click="copyToClipboard(formatUrl(data.urls.public_url), 'URL')" v-tooltip.top="'Copiar URL'" />
                    </div>
                    <span v-else class="text-gray-400">-</span>
                </template>
            </Column>

            <Column header="Acceso">
                <template #body="{ data }">
                    <div v-if="data.is_public" class="flex items-center gap-2">
                        <i :class="data.requires_token ? 'pi pi-lock text-yellow-500' : 'pi pi-globe text-green-500'" />
                        <span>{{ data.requires_token ? 'Con Token' : 'Público' }}</span>
                    </div>
                    <span v-else class="text-gray-400">-</span>
                </template>
            </Column>

            <Column header="Acciones" style="width: 10rem; text-align: center">
                <template #body="{ data }">
                    <div class="flex gap-2 justify-center">
                        <Button @click="openConfigDialog(data)" icon="pi pi-cog" v-tooltip.top="'Configurar'" text rounded />
                        <Button v-if="data.is_public" @click="openTokenManagementDialog(data)" icon="pi pi-key" v-tooltip.top="'Gestionar Token'" text rounded :severity="data.requires_token ? 'warn' : 'success'" />
                        <Button v-if="data.is_public && data.urls.public_url" @click="openCatalogInNewTab(data.urls.public_url)" icon="pi pi-external-link" v-tooltip.top="'Abrir Catálogo'" text rounded severity="info" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Dialog: Configuración de Catálogo -->
        <Dialog v-model:visible="configDialog" modal header="Configurar Catálogo" class="w-full max-w-3xl" :closable="!isLoading">
            <div v-if="isLoading" class="text-center p-4">Cargando configuración...</div>
            <div v-if="currentWarehouse && form" class="space-y-6 p-4">
                <h3 class="font-bold text-xl">{{ currentWarehouse.name }}</h3>

                <!-- Visibilidad y Slug -->
                <Panel header="Visibilidad y URL">
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <label>Visible en la web</label>
                            <ToggleButton v-model="form.is_public_visible" on-icon="pi pi-eye" off-icon="pi pi-eye-slash" />
                        </div>
                        <div v-if="form.is_public_visible">
                            <label class="block mb-2">URL amigable (slug)</label>
                            <div class="p-inputgroup">
                                <span class="p-inputgroup-addon">/tienda/</span>
                                <InputText v-model="form.public_url_slug" @input="onSlugInput" :class="{ 'p-invalid': slugValidation.isAvailable === false }" />
                            </div>
                            <small v-if="slugValidation.message" :class="slugValidation.isAvailable ? 'text-green-500' : 'text-red-500'" class="mt-1 block">
                                {{ slugValidation.message }}
                            </small>
                            <div v-if="slugValidation.suggestions && slugValidation.suggestions.length > 0" class="mt-2">
                                <span>Sugerencias:</span>
                                <Button v-for="s in slugValidation.suggestions" :key="s" @click="useSuggestion(s)" :label="s" link class="p-1" />
                            </div>
                        </div>
                    </div>
                </Panel>

                <!-- Apariencia -->
                <Panel header="Apariencia" :toggleable="true" :collapsed="!form.is_public_visible">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block mb-2">Título (SEO)</label>
                            <InputText v-model="form.seo_title" class="w-full" />
                        </div>
                        <div>
                            <label class="block mb-2">Descripción (SEO)</label>
                            <InputText v-model="form.seo_description" class="w-full" />
                        </div>
                        <div>
                            <label class="block mb-2">Color de cabecera</label>
                            <InputText v-model="form.header_color" class="w-full" />
                        </div>
                    </div>
                </Panel>

                <!-- Opciones -->
                <Panel header="Opciones" :toggleable="true" :collapsed="!form.is_public_visible">
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center justify-between">
                            <label>Mostrar cantidad de stock</label>
                            <ToggleButton v-model="form.show_stock_quantity" />
                        </div>
                        <div class="flex items-center justify-between">
                            <label>Mostrar precios de productos</label>
                            <ToggleButton v-model="form.show_prices" />
                        </div>
                        <div class="flex items-center justify-between">
                            <label>Permitir solicitar cotizaciones</label>
                            <ToggleButton v-model="form.allow_quotes" />
                        </div>
                        <div class="flex items-center justify-between">
                            <label>Requerir token para acceder</label>
                            <ToggleButton v-model="form.require_access_token" />
                        </div>
                    </div>
                </Panel>
            </div>
            <template #footer>
                <Button label="Cancelar" @click="configDialog = false" text />
                <Button label="Guardar" @click="saveConfiguration" :loading="isLoading" icon="pi pi-check" />
            </template>
        </Dialog>

        <!-- Dialog: Token Management -->
        <Dialog v-model:visible="tokenManagementDialog" modal header="Gestionar Token" class="w-96">
            <div v-if="selectedWarehouse">
                <p class="mb-4">El token de acceso restringe la visibilidad de tu catálogo solo a quienes lo tengan.</p>
                <div v-if="selectedWarehouse.requires_token" class="space-y-4">
                    <p>Este catálogo está protegido. Puedes regenerar el token (invalidando el anterior) o eliminarlo para hacerlo público.</p>
                    <Button label="Regenerar Token" @click="handleRegenerateToken" :loading="isLoading" icon="pi pi-refresh" class="w-full" />
                    <Button label="Eliminar Token" @click="handleRemoveToken" :loading="isLoading" icon="pi pi-trash" severity="danger" outlined class="w-full" />
                </div>
                <div v-else>
                    <p>Este catálogo es público. ¿Quieres generar un token para hacerlo privado?</p>
                    <Button label="Generar Token de Acceso" @click="handleRegenerateToken" :loading="isLoading" icon="pi pi-key" class="mt-4 w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cerrar" @click="tokenManagementDialog = false" text />
            </template>
        </Dialog>

        <!-- Dialog: Mostrar Token Nuevo -->
        <Dialog v-model:visible="showNewTokenDialog" modal header="Token de Acceso Generado" class="w-full max-w-md">
            <div class="text-center p-4">
                <i class="pi pi-check-circle text-green-500 text-5xl mb-4"></i>
                <p class="font-bold text-lg">¡Tu token se ha generado con éxito!</p>
                <p class="my-3 text-gray-600">Copia este token y guárdalo en un lugar seguro. **No podrás volver a verlo.**</p>
                <div class="p-inputgroup">
                    <InputText :value="newlyGeneratedToken" readonly />
                    <Button icon="pi pi-copy" @click="copyToClipboard(newlyGeneratedToken, 'Token')" />
                </div>
            </div>
            <template #footer>
                <Button label="Entendido" @click="closeNewTokenDialog" autofocus />
            </template>
        </Dialog>
    </div>
</template>
