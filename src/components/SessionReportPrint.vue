<script setup>
import { defineProps } from 'vue';
const props = defineProps({
    report: { type: Object, required: true }
});

const currency = (val) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val || 0);
};
const formatDate = (d) => (d ? new Date(d).toLocaleString('es-PE') : '-');
</script>

<template>
    <div class="print-container">
        <!-- Header -->
        <header class="text-center mb-4">
            <h1 class="text-2xl font-bold">Reporte de Sesión #{{ report.session?.id }}</h1>
            <p class="text-sm text-gray-600">{{ report.session?.user?.name }} — {{ report.session?.cash_register?.name }}</p>
            <p class="text-sm text-gray-600">Apertura: {{ formatDate(report.session?.opened_at) }} | Cierre: {{ formatDate(report.session?.closed_at) || '—' }}</p>
        </header>

        <!-- Resumen -->
        <section class="mb-6">
            <table class="w-full text-sm border">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border px-2 py-1">Apertura</th>
                        <th class="border px-2 py-1">Esperado</th>
                        <th class="border px-2 py-1">Actual</th>
                        <th class="border px-2 py-1">Diferencia</th>
                        <th class="border px-2 py-1">Ventas</th>
                        <th class="border px-2 py-1">Gastos</th>
                        <th class="border px-2 py-1">Transacciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="border px-2 py-1 text-right">{{ currency(report.summary?.opening_amount) }}</td>
                        <td class="border px-2 py-1 text-right">{{ currency(report.summary?.expected_amount) }}</td>
                        <td class="border px-2 py-1 text-right">{{ currency(report.summary?.actual_amount) }}</td>
                        <td class="border px-2 py-1 text-right">{{ currency(report.summary?.difference_amount) }}</td>
                        <td class="border px-2 py-1 text-right">{{ currency(report.movements_summary?.total_sales) }}</td>
                        <td class="border px-2 py-1 text-right">{{ currency(report.movements_summary?.total_expenses) }}</td>
                        <td class="border px-2 py-1 text-center">{{ report.movements_summary?.sales_count }}</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <!-- Detalle de Ventas -->
        <section v-if="report.sales?.length" class="mb-6">
            <h2 class="font-semibold mb-2">Ventas Detalladas</h2>
            <table class="w-full text-sm border">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border px-2 py-1">#</th>
                        <th class="border px-2 py-1">Comprobante</th>
                        <th class="border px-2 py-1 text-right">Total</th>
                        <th class="border px-2 py-1">Pagos</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="sale in report.sales" :key="sale.sale_id">
                        <td class="border px-2 py-1">{{ sale.sale_id }}</td>
                        <td class="border px-2 py-1">{{ sale.document_number }}</td>
                        <td class="border px-2 py-1 text-right">{{ currency(sale.total_amount) }}</td>
                        <td class="border px-2 py-1">
                            <div v-for="pay in sale.payments" :key="pay.payment_method_name">
                                {{ pay.payment_method_name }}: {{ currency(pay.amount) }} <span v-if="pay.reference_number">(Ref: {{ pay.reference_number }})</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>

        <!-- Desglose Métodos de Pago -->
        <section v-if="report.payment_methods_breakdown?.length" class="mb-6">
            <h2 class="font-semibold mb-2">Desglose por Método de Pago</h2>
            <table class="w-full text-sm border">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border px-2 py-1">Método</th>
                        <th class="border px-2 py-1 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="m in report.payment_methods_breakdown" :key="m.method_name">
                        <td class="border px-2 py-1">{{ m.method_name }}</td>
                        <td class="border px-2 py-1 text-right">{{ currency(m.total_amount) }}</td>
                    </tr>
                </tbody>
            </table>
        </section>
    </div>
</template>

<style scoped>
.print-container {
    font-family: 'Helvetica', Arial, sans-serif;
}
@media print {
    .print-container {
        width: 100%;
        margin: 0;
    }
    table {
        page-break-inside: avoid;
    }
}
</style>
