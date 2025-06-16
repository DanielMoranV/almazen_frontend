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
    },
    loading: {
        type: Boolean,
        default: false
    }
});
</script>

<template>
    <div class="stats-container">
        <!-- Fila superior: Métricas principales -->
        <div class="stats-row primary-stats">
            <!-- Total Órdenes - Destacado -->
            <div class="stat-card featured">
                <div class="stat-content stat-gradient-blue">
                    <template v-if="loading">
                        <div class="skeleton-content">
                            <div class="skeleton-header">
                                <div class="skeleton-badge"></div>
                                <div class="skeleton-icon"></div>
                            </div>
                            <div class="skeleton-body">
                                <div class="skeleton-number large"></div>
                                <div class="skeleton-label"></div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="stat-header">
                            <span class="stat-badge bg-blue-600">Total</span>
                            <i class="pi pi-list stat-icon"></i>
                        </div>
                        <div class="stat-body">
                            <span class="stat-number">{{ statistics.totalOrders || 0 }}</span>
                            <span class="stat-label">Órdenes Totales</span>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Total Monto - Destacado -->
            <div class="stat-card featured">
                <div class="stat-content stat-gradient-emerald">
                    <template v-if="loading">
                        <div class="skeleton-content">
                            <div class="skeleton-header">
                                <div class="skeleton-badge"></div>
                                <div class="skeleton-icon"></div>
                            </div>
                            <div class="skeleton-body">
                                <div class="skeleton-number currency"></div>
                                <div class="skeleton-label"></div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="stat-header">
                            <span class="stat-badge bg-emerald-600">Egresos</span>
                            <i class="pi pi-money-bill stat-icon"></i>
                        </div>
                        <div class="stat-body">
                            <span class="stat-number-currency">{{ formatCurrencyPEN(statistics.totalAmount || 0) }}</span>
                            <span class="stat-label">Total Consumido</span>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Fila inferior: Estados de órdenes -->
        <div class="stats-row secondary-stats">
            <!-- Pendientes -->
            <div class="stat-card">
                <div class="stat-content stat-gradient-amber">
                    <template v-if="loading">
                        <div class="skeleton-content-small">
                            <div class="skeleton-header-small">
                                <div class="skeleton-icon-small"></div>
                                <div class="skeleton-number-small"></div>
                            </div>
                            <div class="skeleton-label-small"></div>
                            <div class="skeleton-progress"></div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="stat-header-small">
                            <i class="pi pi-clock stat-icon-small"></i>
                            <span class="stat-number-small">{{ statistics.pendingOrders || 0 }}</span>
                        </div>
                        <span class="stat-label-small">Pendientes</span>
                        <div class="stat-progress-container">
                            <div class="stat-progress">
                                <div
                                    class="progress-bar bg-amber-400"
                                    :style="{
                                        width: statistics.totalOrders ? (statistics.pendingOrders / statistics.totalOrders) * 100 + '%' : '0%'
                                    }"
                                ></div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Aprobadas -->
            <div class="stat-card">
                <div class="stat-content stat-gradient-green">
                    <template v-if="loading">
                        <div class="skeleton-content-small">
                            <div class="skeleton-header-small">
                                <div class="skeleton-icon-small"></div>
                                <div class="skeleton-number-small"></div>
                            </div>
                            <div class="skeleton-label-small"></div>
                            <div class="skeleton-progress"></div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="stat-header-small">
                            <i class="pi pi-check-circle stat-icon-small"></i>
                            <span class="stat-number-small">{{ statistics.approvedOrders || 0 }}</span>
                        </div>
                        <span class="stat-label-small">Aprobadas</span>
                        <div class="stat-progress-container">
                            <div class="stat-progress">
                                <div
                                    class="progress-bar bg-green-400"
                                    :style="{
                                        width: statistics.totalOrders ? (statistics.approvedOrders / statistics.totalOrders) * 100 + '%' : '0%'
                                    }"
                                ></div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Recibidas -->
            <div class="stat-card">
                <div class="stat-content stat-gradient-cyan">
                    <template v-if="loading">
                        <div class="skeleton-content-small">
                            <div class="skeleton-header-small">
                                <div class="skeleton-icon-small"></div>
                                <div class="skeleton-number-small"></div>
                            </div>
                            <div class="skeleton-label-small"></div>
                            <div class="skeleton-progress"></div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="stat-header-small">
                            <i class="pi pi-box stat-icon-small"></i>
                            <span class="stat-number-small">{{ statistics.receivedOrders || 0 }}</span>
                        </div>
                        <span class="stat-label-small">Recibidas</span>
                        <div class="stat-progress-container">
                            <div class="stat-progress">
                                <div
                                    class="progress-bar bg-cyan-400"
                                    :style="{
                                        width: statistics.totalOrders ? (statistics.receivedOrders / statistics.totalOrders) * 100 + '%' : '0%'
                                    }"
                                ></div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Canceladas -->
            <div class="stat-card">
                <div class="stat-content stat-gradient-red">
                    <template v-if="loading">
                        <div class="skeleton-content-small">
                            <div class="skeleton-header-small">
                                <div class="skeleton-icon-small"></div>
                                <div class="skeleton-number-small"></div>
                            </div>
                            <div class="skeleton-label-small"></div>
                            <div class="skeleton-progress"></div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="stat-header-small">
                            <i class="pi pi-times-circle stat-icon-small"></i>
                            <span class="stat-number-small">{{ statistics.cancelledOrders || 0 }}</span>
                        </div>
                        <span class="stat-label-small">Anuladas</span>
                        <div class="stat-progress-container">
                            <div class="stat-progress">
                                <div
                                    class="progress-bar bg-red-400"
                                    :style="{
                                        width: statistics.totalOrders ? (statistics.cancelledOrders / statistics.totalOrders) * 100 + '%' : '0%'
                                    }"
                                ></div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stats-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 0;
}

.stats-row {
    display: grid;
    gap: 1rem;
}

.primary-stats {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.secondary-stats {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* Tarjetas principales */
.stat-card {
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

/* Tarjetas superiores compactas */
.primary-stats .stat-card {
    min-height: 80px;
}
.primary-stats .stat-content {
    padding: 0.7rem 0.9rem;
}
.primary-stats .stat-number {
    font-size: 1.15rem;
    font-weight: 700;
}
.primary-stats .stat-number-currency {
    font-size: 0.95rem;
    font-weight: 600;
}

@media (max-width: 768px) {
    .primary-stats .stat-content {
        padding: 0.6rem 0.7rem;
    }
    .primary-stats .stat-number {
        font-size: 1rem;
    }
    .primary-stats .stat-number-currency {
        font-size: 0.85rem;
    }
}

/* Ajuste general para todas las tarjetas para hacerlas más compactas */
.stat-card {
    min-height: 90px;
}

.stat-content {
    padding: 0.75rem 1rem;
}

.stat-number {
    font-size: 1.3rem;
    font-weight: 700;
}

.stat-number-currency {
    font-size: 1.05rem;
    font-weight: 600;
}

@media (max-width: 768px) {
    .stat-content {
        padding: 0.75rem 0.75rem;
    }
    .stat-number {
        font-size: 1.1rem;
    }
    .stat-number-currency {
        font-size: 0.95rem;
    }
}

.stat-content {
    padding: 1.25rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.stat-content::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(30px, -30px);
}

/* Gradientes mejorados */
.stat-gradient-blue {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
    color: white;
}

.stat-gradient-emerald {
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
    color: white;
}

.stat-gradient-amber {
    background: linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%);
    color: white;
}

.stat-gradient-green {
    background: linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%);
    color: white;
}

.stat-gradient-cyan {
    background: linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%);
    color: white;
}

.stat-gradient-red {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
    color: white;
}

/* Headers de tarjetas principales */
.stat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
}

.stat-badge {
    padding: 0.375rem 0.875rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-icon {
    font-size: 1.5rem;
    opacity: 0.9;
}

/* Cuerpo de tarjetas principales */
.stat-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-grow: 1;
    justify-content: center;
}

.stat-number {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-number-currency {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
    font-size: 0.875rem;
    font-weight: 500;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Tarjetas secundarias */
.stat-header-small {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.stat-numbers {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

.stat-percentage {
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0.8;
    background: rgba(255, 255, 255, 0.15);
    padding: 0.125rem 0.5rem;
    border-radius: 0.5rem;
    backdrop-filter: blur(10px);
}

.stat-icon-small {
    font-size: 1.25rem;
    opacity: 0.9;
}

.stat-number-small {
    font-size: 1.5rem;
    font-weight: 700;
}

.stat-label-small {
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
    display: block;
}

/* Barras de progreso mejoradas */
.stat-progress-container {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.stat-progress {
    width: 100%;
    height: 6px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin: 0;
    padding: 0;
    position: relative;
    /* Sin borde, sin box-shadow extra */
}

.progress-bar {
    height: 100%;
    border-radius: 4px 0 0 4px;
    transition: width 0.8s cubic-bezier(0.4, 2, 0.6, 1);
    box-shadow:
        0 1px 8px 0 rgba(0, 0, 0, 0.15) inset,
        0 0 12px rgba(255, 255, 255, 0.25);
    position: relative;
    min-width: 0;
    opacity: 0.96;
    filter: brightness(1.1) saturate(1.2);
}

.progress-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
    animation: shimmer 2s infinite;
}

.progress-text {
    font-size: 0.65rem;
    font-weight: 500;
    opacity: 0.85;
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Estilos de Skeleton Loading */
.skeleton-content,
.skeleton-content-small {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}

.skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
}

.skeleton-header-small {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.skeleton-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-grow: 1;
    justify-content: center;
}

.skeleton-badge {
    height: 1.5rem;
    width: 4rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 9999px;
}

.skeleton-icon {
    height: 1.5rem;
    width: 1.5rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
}

.skeleton-icon-small {
    height: 1.25rem;
    width: 1.25rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
}

.skeleton-number {
    height: 2rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
}

.skeleton-number.large {
    width: 4rem;
    height: 2rem;
}

.skeleton-number.currency {
    width: 6rem;
    height: 1.5rem;
}

.skeleton-number-small {
    height: 1.5rem;
    width: 2.5rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.375rem;
}

.skeleton-label {
    height: 0.875rem;
    width: 7rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
}

.skeleton-label-small {
    height: 0.75rem;
    width: 5rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
    margin-bottom: 0.75rem;
}

.skeleton-progress {
    height: 6px;
    width: 100%;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    margin-top: auto;
}

/* Animación de skeleton */
.skeleton-badge,
.skeleton-icon,
.skeleton-icon-small,
.skeleton-number,
.skeleton-number-small,
.skeleton-label,
.skeleton-label-small,
.skeleton-progress {
    animation: skeleton-pulse 1.5s ease-in-out infinite alternate;
}

@keyframes skeleton-pulse {
    0% {
        opacity: 0.6;
    }
    100% {
        opacity: 1;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .stats-container {
        gap: 1rem;
    }

    .primary-stats {
        grid-template-columns: 1fr;
    }

    .secondary-stats {
        grid-template-columns: repeat(2, 1fr);
    }

    .stat-number {
        font-size: 2rem;
    }

    .stat-number-currency {
        font-size: 1.5rem;
    }
}

@media (max-width: 480px) {
    .secondary-stats {
        grid-template-columns: 1fr;
    }

    .stat-content {
        padding: 1.25rem;
    }
}

/* Animaciones */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.stat-card {
    animation: fadeInUp 0.6s ease forwards;
}

.stat-card:nth-child(2) {
    animation-delay: 0.1s;
}

.stat-card:nth-child(3) {
    animation-delay: 0.2s;
}

.stat-card:nth-child(4) {
    animation-delay: 0.3s;
}
</style>
