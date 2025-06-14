<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    statistics: {
        type: Object,
        required: true
    },
    formatCurrencyPEN: {
        type: Function,
        required: true
    }
});

console.log(props.statistics);
</script>

<template>
    <div class="grid">
        <!-- Estadísticas modernas y responsivas extraídas -->
        <div class="col-12">
            <div class="flex flex-wrap gap-3 justify-content-center md:justify-content-start">
                <div class="stat-card flex-1 min-w-16rem max-w-20rem p-0">
                    <div class="stat-gradient stat-blue flex flex-column align-items-start p-4 border-round-xl shadow-3 relative">
                        <span class="stat-badge bg-blue-500">Órdenes</span>
                        <div class="flex align-items-center gap-2 mt-2">
                            <i class="pi pi-list text-4xl text-blue-100"></i>
                            <span class="text-4xl font-bold text-white">{{ statistics.totalOrders || 0 }}</span>
                        </div>
                        <span class="stat-label mt-2">Total Órdenes</span>
                    </div>
                </div>
                <div class="stat-card flex-1 min-w-16rem max-w-20rem p-0">
                    <div class="stat-gradient stat-orange flex flex-column align-items-start p-4 border-round-xl shadow-3 relative">
                        <span class="stat-badge bg-orange-500">Pendientes</span>
                        <div class="flex align-items-center gap-2 mt-2">
                            <i class="pi pi-clock text-4xl text-orange-100"></i>
                            <span class="text-4xl font-bold text-white">{{ statistics.pendingOrders || 0 }}</span>
                        </div>
                        <span class="stat-label mt-2">Pendientes</span>
                    </div>
                </div>
                <div class="stat-card flex-1 min-w-16rem max-w-20rem p-0">
                    <div class="stat-gradient stat-cyan flex flex-column align-items-start p-4 border-round-xl shadow-3 relative">
                        <span class="stat-badge bg-cyan-500">Aprobadas</span>
                        <div class="flex align-items-center gap-2 mt-2">
                            <i class="pi pi-check-circle text-4xl text-cyan-100"></i>
                            <span class="text-4xl font-bold text-white">{{ statistics.approvedOrders || 0 }}</span>
                        </div>
                        <span class="stat-label mt-2">Aprobadas</span>
                    </div>
                </div>
                <div class="stat-card flex-1 min-w-16rem max-w-20rem p-0">
                    <div class="stat-gradient stat-green flex flex-column align-items-start p-4 border-round-xl shadow-3 relative">
                        <span class="stat-badge bg-green-500">Total S/</span>
                        <div class="flex align-items-center gap-2 mt-2">
                            <i class="pi pi-money-bill text-4xl text-green-100"></i>
                            <span class="text-2xl font-bold text-white">{{ formatCurrencyPEN(statistics.totalAmount || 0) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stat-card {
    flex: 1 1 16rem;
    min-width: 16rem;
    padding: 0;
}
.stat-gradient {
    border-radius: 1.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    position: relative;
}
.stat-blue {
    background: linear-gradient(90deg, #2563eb 0%, #60a5fa 100%);
}
.stat-orange {
    background: linear-gradient(90deg, #f59e42 0%, #fbbf24 100%);
}
.stat-cyan {
    background: linear-gradient(90deg, #06b6d4 0%, #67e8f9 100%);
}
.stat-green {
    background: linear-gradient(90deg, #22c55e 0%, #86efac 100%);
}
.stat-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    z-index: 2;
}
.stat-label {
    color: #e0e7ef;
    font-size: 0.8rem;
    font-weight: 500;
}

/* Iconos de estadísticas */
.text-blue-100 {
    color: #dbeafe;
}
.text-orange-100 {
    color: #ffedd5;
}
.text-cyan-100 {
    color: #cffafe;
}
.text-green-100 {
    color: #bbf7d0;
}

@media (max-width: 768px) {
    .stat-card {
        min-width: 100%;
        max-width: 100%;
    }
}
</style>
