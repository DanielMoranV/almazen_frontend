<script setup>
import { ref } from 'vue';

const sections = ref([
    {
        title: 'Panel Principal',
        icon: 'pi pi-home',
        features: [
            {
                name: 'Dashboard',
                icon: 'pi pi-chart-line',
                description: 'Visualiza métricas clave de tu negocio en tiempo real. Monitorea ventas, compras, valor de inventario y recibe alertas importantes sobre stock bajo o productos por vencer.'
            },
            {
                name: 'Reportes',
                icon: 'pi pi-file-excel',
                description: 'Genera y descarga reportes detallados sobre ventas, inventario, finanzas y más para tomar decisiones informadas.'
            }
        ]
    },
    {
        title: 'Módulo de Comercio',
        icon: 'pi pi-shopping-cart',
        features: [
            {
                name: 'Punto de Venta (POS)',
                icon: 'pi pi-desktop',
                description: 'Realiza ventas rápidas y eficientes. Busca productos, gestiona el carrito y procesa pagos de forma integrada. Requiere una sesión de caja activa.'
            },
            {
                name: 'Gestión de Caja',
                icon: 'pi pi-wallet',
                description: 'Controla las cajas registradoras, métodos de pago y todos los movimientos de efectivo, como ingresos, egresos y depósitos.'
            },
            {
                name: 'Ventas y Compras',
                icon: 'pi pi-shopping-bag',
                description: 'Administra el ciclo completo de ventas y compras. Registra órdenes, gestiona facturas y cotizaciones.'
            },
            {
                name: 'Socios Comerciales',
                icon: 'pi pi-users',
                description: 'Gestiona tu base de datos de clientes y proveedores. Mantén la información de contacto y el historial de transacciones.'
            }
        ]
    },
    {
        title: 'Módulo de Inventario',
        icon: 'pi pi-box',
        features: [
            {
                name: 'Productos',
                icon: 'pi pi-tags',
                description: 'Administra tu catálogo completo. Crea, edita y organiza todos tus productos, incluyendo detalles como SKU, precios y control de lotes.'
            },
            {
                name: 'Control de Stock',
                icon: 'pi pi-list',
                description: 'Consulta el stock actual de tus productos en todos los almacenes. Visualiza cantidades disponibles, costos y precios de venta.'
            },
            {
                name: 'Movimientos de Stock',
                icon: 'pi pi-history',
                description: 'Rastrea cada movimiento de inventario, ya sea por ventas, compras, ajustes o transferencias entre almacenes.'
            },
            {
                name: 'Almacenes',
                icon: 'pi pi-building',
                description: 'Configura y gestiona múltiples almacenes o bodegas para organizar tu inventario de manera eficiente.'
            }
        ]
    },
    {
        title: 'Módulo de Administración',
        icon: 'pi pi-cog',
        features: [
            {
                name: 'Gestión de Empresa',
                icon: 'pi pi-sitemap',
                description: 'Configura los datos de tu empresa, incluyendo flujos de trabajo como el proceso de compras (estándar o simplificado).'
            },
            {
                name: 'Gestión de Usuarios',
                icon: 'pi pi-users',
                description: 'Administra los usuarios del sistema, asigna roles y permisos. Cada usuario puede también gestionar su propio perfil.'
            },
            {
                name: 'Configuración del Sistema',
                icon: 'pi pi-sliders-h',
                description: 'Define parámetros globales del sistema, como categorías de productos y unidades de medida.'
            }
        ]
    }
]);
</script>

<template>
    <div class="onboarding-guide-page">
        <div class="guide-header">
            <i class="pi pi-question-circle guide-icon"></i>
            <h1 class="guide-title">Guía de Funcionalidades de AlmaZen</h1>
            <p class="guide-subtitle">Descubre todo lo que puedes hacer en el sistema.</p>
        </div>

        <div class="guide-content">
            <Accordion :multiple="true" :activeIndex="[0]">
                <AccordionTab v-for="(section, index) in sections" :key="index">
                    <template #header>
                        <div class="accordion-header">
                            <i :class="[section.icon, 'header-icon']"></i>
                            <span class="header-title">{{ section.title }}</span>
                        </div>
                    </template>
                    <div class="features-grid">
                        <div v-for="(feature, fIndex) in section.features" :key="fIndex" class="feature-card">
                            <div class="feature-icon-wrapper">
                                <i :class="[feature.icon, 'feature-icon']"></i>
                            </div>
                            <div class="feature-text">
                                <h4 class="feature-name">{{ feature.name }}</h4>
                                <p class="feature-description">{{ feature.description }}</p>
                            </div>
                        </div>
                    </div>
                </AccordionTab>
            </Accordion>
        </div>
    </div>
</template>

<style scoped>
.onboarding-guide-page {
    @apply p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen;
}

.guide-header {
    @apply text-center mb-8;
}

.guide-icon {
    @apply text-5xl text-blue-500 mb-4;
}

.guide-title {
    @apply text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100;
}

.guide-subtitle {
    @apply text-lg text-gray-600 dark:text-gray-400 mt-2;
}

.guide-content {
    @apply max-w-4xl mx-auto;
}

.accordion-header {
    @apply flex items-center gap-3 p-3;
}

.header-icon {
    @apply text-xl text-blue-600 dark:text-blue-400;
}

.header-title {
    @apply font-semibold text-lg text-gray-800 dark:text-gray-200;
}

.features-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4 p-4;
}

.feature-card {
    @apply flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-blue-300;
}

.feature-icon-wrapper {
    @apply flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center;
}

.feature-icon {
    @apply text-2xl text-blue-600 dark:text-blue-400;
}

.feature-text {
    @apply flex-1;
}

.feature-name {
    @apply font-semibold text-gray-800 dark:text-gray-200 mb-1;
}

.feature-description {
    @apply text-sm text-gray-600 dark:text-gray-400 leading-relaxed;
}

:deep(.p-accordion-header-link) {
    background-color: var(--surface-card) !important;
    border: 1px solid var(--surface-border) !important;
}

:deep(.p-accordion-tab.p-accordion-tab-active .p-accordion-header-link) {
    border-bottom: none !important;
    border-radius: 6px 6px 0 0;
}

:deep(.p-accordion-content) {
    background-color: var(--surface-ground) !important;
    border: 1px solid var(--surface-border) !important;
    border-top: none !important;
}
</style>
