<template>
  <Dialog v-model:visible="visible" :modal="true" :closable="false" header="Registrar Compra" style="width: 800px; max-width: 95vw;">
    <form @submit.prevent="handleSubmit">
      <div class="p-fluid p-formgrid p-grid">
        <!-- Campos principales -->
        <InputText v-model="form.document_number" label="N° Documento" class="p-col-12 p-md-6" placeholder="Ej: F001-123456" required />
        <Dropdown v-model="form.document_type" :options="documentTypes" optionLabel="label" optionValue="value" label="Tipo de Documento" class="p-col-12 p-md-6" placeholder="Seleccione tipo" required />
        <Dropdown v-model="form.provider_id" :options="providers" optionLabel="name" optionValue="id" label="Proveedor" class="p-col-12 p-md-6" placeholder="Seleccione proveedor" required />
        <Dropdown v-model="form.warehouse_id" :options="warehouses" optionLabel="name" optionValue="id" label="Almacén" class="p-col-12 p-md-6" placeholder="Seleccione almacén" required />
        <Calendar v-model="form.purchase_date" dateFormat="yy-mm-dd" label="Fecha de compra" class="p-col-12 p-md-6" showIcon required />
        <Textarea v-model="form.notes" label="Notas" class="p-col-12" rows="2" autoResize placeholder="Notas adicionales" />
      </div>

      <!-- Detalles de productos -->
      <h4 class="mt-4">Detalles de productos</h4>
      <DataTable :value="form.details" class="p-datatable-sm" responsiveLayout="scroll">
        <Column field="product_id" header="Producto">
          <template #body="{ data, index }">
            <Dropdown v-model="form.details[index].product_id" :options="products" optionLabel="name" optionValue="id" placeholder="Producto" style="width: 140px" />
          </template>
        </Column>
        <Column field="batch_id" header="Lote">
          <template #body="{ data, index }">
            <Dropdown v-model="form.details[index].batch_id" :options="batches" optionLabel="code" optionValue="id" :placeholder="'Sin lote'" style="width: 120px" :showClear="true" />
          </template>
        </Column>
        <Column field="quantity" header="Cantidad">
          <template #body="{ data, index }">
            <InputNumber v-model="form.details[index].quantity" :min="0" :step="0.01" style="width: 80px" />
          </template>
        </Column>
        <Column field="unit_price" header="Precio U.">
          <template #body="{ data, index }">
            <InputNumber v-model="form.details[index].unit_price" :min="0" :step="0.01" mode="currency" currency="PEN" style="width: 100px" />
          </template>
        </Column>
        <Column field="total_amount" header="Subtotal">
          <template #body="{ data, index }">
            <span>{{ calcDetailTotal(index) }}</span>
          </template>
        </Column>
        <Column field="tax_amount" header="IGV">
          <template #body="{ data, index }">
            <InputNumber v-model="form.details[index].tax_amount" :min="0" :step="0.01" style="width: 80px" />
          </template>
        </Column>
        <Column field="discount_amount" header="Descuento">
          <template #body="{ data, index }">
            <InputNumber v-model="form.details[index].discount_amount" :min="0" :step="0.01" style="width: 80px" />
          </template>
        </Column>
        <Column header="">
          <template #body="{ index }">
            <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click="removeDetail(index)" />
          </template>
        </Column>
      </DataTable>
      <Button icon="pi pi-plus" label="Agregar producto" class="p-button-outlined mt-2" @click="addDetail" />

      <!-- Totales -->
      <div class="flex justify-content-end gap-4 mt-4">
        <span><b>Subtotal:</b> {{ subtotal }}</span>
        <span><b>IGV:</b> {{ form.tax_amount }}</span>
        <span><b>Descuento:</b> {{ form.discount_amount }}</span>
        <span><b>Total:</b> {{ form.total_amount }}</span>
      </div>

      <!-- Botones -->
      <div class="flex justify-content-end gap-2 mt-4">
        <Button label="Cancelar" class="p-button-secondary" @click="close" type="button" />
        <Button label="Guardar" icon="pi pi-save" type="submit" />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Dialog } from 'primevue/dialog';
import { InputText } from 'primevue/inputtext';
import { Dropdown } from 'primevue/dropdown';
import { Calendar } from 'primevue/calendar';
import { Textarea } from 'primevue/textarea';
import { DataTable } from 'primevue/datatable';
import { Column } from 'primevue/column';
import { Button } from 'primevue/button';
import { InputNumber } from 'primevue/inputnumber';

// Estado del diálogo
const visible = ref(false); // Controla visibilidad del modal

// Opciones simuladas (reemplazar por datos reales)
const providers = ref([
  { id: 1, name: 'Proveedor Principal S.A.' },
  { id: 5, name: 'Distribuidora XYZ' }
]);
const warehouses = ref([
  { id: 2, name: 'Almacén Central' }
]);
const documentTypes = ref([
  { label: 'Factura', value: 'FACTURA' },
  { label: 'Boleta', value: 'BOLETA' },
  { label: 'Nota de Crédito', value: 'NOTA_CREDITO' }
]);
const products = ref([
  { id: 101, name: 'Producto A' },
  { id: 102, name: 'Producto B' }
]);
const batches = ref([
  { id: 201, code: 'LOTE-2025-06-01' }
]);

// Formulario reactivo
const form = ref({
  company_id: '123e4567-e89b-12d3-a456-426614174000',
  provider_id: null,
  warehouse_id: null,
  document_type: null,
  document_number: '',
  purchase_date: '',
  total_amount: 0,
  tax_amount: 0,
  discount_amount: 0,
  notes: '',
  details: []
});

// Cálculos de totales
const subtotal = computed(() => form.value.details.reduce((sum, d) => sum + (d.quantity * d.unit_price || 0), 0));

watch(
  () => form.value.details,
  (details) => {
    // Calcula totales generales
    form.value.tax_amount = details.reduce((sum, d) => sum + (d.tax_amount || 0), 0);
    form.value.discount_amount = details.reduce((sum, d) => sum + (d.discount_amount || 0), 0);
    form.value.total_amount = subtotal.value + form.value.tax_amount - form.value.discount_amount;
  },
  { deep: true }
);

function calcDetailTotal(index) {
  const d = form.value.details[index];
  return ((d.quantity || 0) * (d.unit_price || 0)).toFixed(2);
}

function addDetail() {
  form.value.details.push({
    product_id: null,
    batch_id: null,
    quantity: 1,
    unit_price: 0,
    total_amount: 0,
    tax_amount: 0,
    discount_amount: 0
  });
}

function removeDetail(index) {
  form.value.details.splice(index, 1);
}

function close() {
  visible.value = false;
}

function handleSubmit() {
  // Aquí va la lógica para guardar la compra (emitir evento o llamar API)
  // Por ahora, solo cerrar el diálogo
  close();
}

// Exponer el método para abrir el diálogo desde el padre si es necesario
// defineExpose({ open: () => (visible.value = true) });
</script>

<style scoped>
.p-formgrid .p-col-12, .p-formgrid .p-md-6 {
  margin-bottom: 1rem;
}
</style>
