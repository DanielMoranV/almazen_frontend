<script setup>
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import { useStockAdjustmentsStore } from '@/stores/stockAdjustmentsStore';
import { useWarehousesStore } from '@/stores/warehousesStore';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'importCompleted']);

// Stores
const stockAdjustmentsStore = useStockAdjustmentsStore();
const warehousesStore = useWarehousesStore();

// Estado local
const selectedFile = ref(null);
const globalReason = ref('');
const globalReference = ref('');
const skipErrors = ref(false);
const includeExpired = ref(false);
const selectedWarehouseForTemplate = ref(null);

// Computed
const isVisible = computed({
    get() {
        return props.visible;
    },
    set(value) {
        emit('update:visible', value);
    }
});

const isProcessing = computed(() => stockAdjustmentsStore.isExcelProcessing);
const importErrors = computed(() => stockAdjustmentsStore.importErrors);
const importResult = computed(() => stockAdjustmentsStore.importResult);

const warehouseOptions = computed(() => {
    return [{ label: 'Todos los almacenes', value: null }, ...warehousesStore.warehouses.map((w) => ({ label: w.name, value: w.id }))];
});

// Métodos
const handleFileSelect = (event) => {
    const files = event.files || event.target.files;
    if (files && files.length > 0) {
        selectedFile.value = files[0];

        // Validar archivo
        if (!validateFile(selectedFile.value)) {
            selectedFile.value = null;
        }
    }
};

const validateFile = (file) => {
    // Validar extensión
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        alert('Solo se permiten archivos Excel (.xlsx, .xls)');
        return false;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no puede superar los 5MB');
        return false;
    }

    return true;
};

const downloadTemplate = async () => {
    try {
        await stockAdjustmentsStore.downloadTemplate({
            warehouse_id: selectedWarehouseForTemplate.value,
            include_expired: includeExpired.value
        });
    } catch (error) {
        console.error('Error descargando plantilla:', error);
    }
};

const importFile = async () => {
    if (!selectedFile.value) {
        alert('Selecciona un archivo Excel');
        return;
    }

    if (!globalReason.value.trim()) {
        alert('Ingresa una razón para los ajustes');
        return;
    }

    try {
        const result = await stockAdjustmentsStore.importFromExcel(selectedFile.value, {
            globalReason: globalReason.value,
            globalReference: globalReference.value,
            skipErrors: skipErrors.value
        });

        if (result.success) {
            emit('importCompleted', result);
        }
    } catch (error) {
        console.error('Error importando archivo:', error);
    }
};

const resetForm = () => {
    selectedFile.value = null;
    globalReason.value = '';
    globalReference.value = '';
    skipErrors.value = false;
    stockAdjustmentsStore.clearImportResult();
};

const closeDialog = () => {
    resetForm();
    isVisible.value = false;
};
</script>

<template>
    <Dialog v-model:visible="isVisible" modal header="Importar Ajustes desde Excel" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" class="excel-import-dialog" @hide="resetForm">
        <div class="import-container">
            <!-- Sección 1: Descargar Plantilla -->
            <div class="section">
                <div class="section-header">
                    <i class="pi pi-download"></i>
                    <h3>1. Descargar Plantilla</h3>
                </div>
                <div class="section-content">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label class="field-label">Almacén (opcional)</label>
                            <Dropdown v-model="selectedWarehouseForTemplate" :options="warehouseOptions" optionLabel="label" optionValue="value" placeholder="Todos los almacenes" class="w-full" />
                        </div>
                        <div class="col-12 md:col-6 flex align-items-center">
                            <Checkbox v-model="includeExpired" inputId="includeExpired" binary />
                            <label for="includeExpired" class="ml-2">Incluir lotes vencidos</label>
                        </div>
                    </div>
                    <div class="mt-3">
                        <Button icon="pi pi-download" label="Descargar Plantilla Excel" class="template-btn" @click="downloadTemplate" :loading="isProcessing" />
                    </div>
                    <div class="template-info">
                        <i class="pi pi-info-circle"></i>
                        <span>La plantilla incluye todos los productos con stock actual. Completa las columnas verdes con los nuevos valores.</span>
                    </div>
                </div>
            </div>

            <!-- Sección 2: Subir Archivo -->
            <div class="section">
                <div class="section-header">
                    <i class="pi pi-upload"></i>
                    <h3>2. Subir Archivo Completado</h3>
                </div>
                <div class="section-content">
                    <div class="file-upload-area">
                        <FileUpload mode="basic" accept=".xlsx,.xls" :maxFileSize="5000000" :customUpload="true" @select="handleFileSelect" chooseLabel="Seleccionar Archivo Excel" class="file-upload" />
                        <div v-if="selectedFile" class="selected-file">
                            <i class="pi pi-file-excel"></i>
                            <span>{{ selectedFile.name }}</span>
                            <small>({{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB)</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sección 3: Configuración Global -->
            <div class="section">
                <div class="section-header">
                    <i class="pi pi-cog"></i>
                    <h3>3. Configuración Global</h3>
                </div>
                <div class="section-content">
                    <div class="grid">
                        <div class="col-12">
                            <label class="field-label required">Razón de los Ajustes</label>
                            <InputText v-model="globalReason" placeholder="Ej: Conteo físico mensual" class="w-full" maxlength="255" />
                        </div>
                        <div class="col-12">
                            <label class="field-label">Documento de Referencia</label>
                            <InputText v-model="globalReference" placeholder="Ej: INV-2024-001" class="w-full" maxlength="100" />
                        </div>
                        <div class="col-12">
                            <div class="flex align-items-center">
                                <Checkbox v-model="skipErrors" inputId="skipErrors" binary />
                                <label for="skipErrors" class="ml-2">Continuar aunque haya errores en algunas filas</label>
                            </div>
                            <small class="text-muted">Si está marcado, se procesarán las filas correctas aunque algunas tengan errores.</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Progreso de Importación -->
            <div v-if="isProcessing" class="progress-section">
                <ProgressBar mode="indeterminate" class="mb-3" />
                <p class="text-center">Procesando archivo Excel...</p>
            </div>

            <!-- Resultado de Importación -->
            <div v-if="importResult" class="result-section">
                <Message severity="success" :closable="false">
                    <div class="import-summary">
                        <h4>Importación Completada</h4>
                        <div class="summary-stats">
                            <div class="stat">
                                <strong>{{ importResult.summary.total_rows_processed }}</strong>
                                <span>Filas procesadas</span>
                            </div>
                            <div class="stat success">
                                <strong>{{ importResult.summary.successful_adjustments }}</strong>
                                <span>Ajustes exitosos</span>
                            </div>
                            <div class="stat error" v-if="importResult.summary.failed_rows > 0">
                                <strong>{{ importResult.summary.failed_rows }}</strong>
                                <span>Filas con errores</span>
                            </div>
                        </div>
                    </div>
                </Message>
            </div>

            <!-- Errores de Importación -->
            <div v-if="importErrors && importErrors.length > 0" class="errors-section">
                <Message severity="warn" :closable="false">
                    <div class="errors-content">
                        <h4>Errores Encontrados</h4>
                        <div class="errors-list">
                            <div v-for="(error, index) in importErrors.slice(0, 10)" :key="index" class="error-item">
                                {{ error }}
                            </div>
                            <div v-if="importErrors.length > 10" class="more-errors">... y {{ importErrors.length - 10 }} errores más</div>
                        </div>
                    </div>
                </Message>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="closeDialog" :disabled="isProcessing" />
                <Button label="Importar Ajustes" icon="pi pi-check" class="import-btn" @click="importFile" :loading="isProcessing" :disabled="!selectedFile || !globalReason.trim()" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.excel-import-dialog {
    font-family: 'Inter', sans-serif;
}

.import-container {
    @apply space-y-6;
}

/* Secciones */
.section {
    @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.section-header {
    @apply bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center gap-3;
}

.section-header i {
    @apply text-blue-500 text-lg;
}

.section-header h3 {
    @apply text-base font-semibold text-gray-900 dark:text-white m-0;
}

.section-content {
    @apply p-4;
}

/* Labels */
.field-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.field-label.required::after {
    content: ' *';
    @apply text-red-500;
}

/* Botón de plantilla */
.template-btn {
    @apply bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600 text-white;
}

.template-info {
    @apply mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300;
}

.template-info i {
    @apply text-blue-500 mt-0.5;
}

/* Área de carga de archivos */
.file-upload-area {
    @apply border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-800;
}

.selected-file {
    @apply mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center gap-2 text-green-700 dark:text-green-300;
}

.selected-file i {
    @apply text-xl text-green-500;
}

/* Sección de progreso */
.progress-section {
    @apply p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg;
}

/* Sección de resultados */
.result-section {
    @apply mt-4;
}

.import-summary h4 {
    @apply text-lg font-semibold text-green-800 dark:text-green-200 mb-3;
}

.summary-stats {
    @apply flex gap-6 flex-wrap;
}

.stat {
    @apply text-center;
}

.stat strong {
    @apply block text-2xl font-bold text-gray-900 dark:text-white;
}

.stat span {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

.stat.success strong {
    @apply text-green-600 dark:text-green-400;
}

.stat.error strong {
    @apply text-red-600 dark:text-red-400;
}

/* Sección de errores */
.errors-section {
    @apply mt-4;
}

.errors-content h4 {
    @apply text-lg font-semibold text-orange-800 dark:text-orange-200 mb-3;
}

.errors-list {
    @apply space-y-1 max-h-40 overflow-y-auto;
}

.error-item {
    @apply text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 p-2 rounded;
}

.more-errors {
    @apply text-sm text-orange-600 dark:text-orange-400 font-medium p-2;
}

/* Footer */
.dialog-footer {
    @apply flex justify-end gap-2;
}

.import-btn {
    @apply bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600;
}

/* Responsive */
@media (max-width: 768px) {
    .summary-stats {
        @apply justify-center;
    }

    .dialog-footer {
        @apply flex-col gap-2;
    }

    .dialog-footer .p-button {
        @apply w-full;
    }
}
</style>
