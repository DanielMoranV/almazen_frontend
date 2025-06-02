<template>
  <div>
    <h1>Ventas</h1>
    <SalesTable />
    <SaleFormDialog />
  </div>
</template>

<script setup>
import SalesTable from '@/components/sales/SalesTable.vue';
import SaleFormDialog from '@/components/sales/SaleFormDialog.vue';
</script>
