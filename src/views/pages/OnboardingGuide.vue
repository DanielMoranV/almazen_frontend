<script setup>
import { ref } from 'vue';

const sections = ref([
    {
        title: 'Introducción - Roles del Sistema',
        icon: 'pi pi-users',
        features: [
            {
                name: 'Administrador',
                icon: 'pi pi-shield',
                description: 'Acceso completo al sistema. Gestiona usuarios, configuración empresarial, sistema de cajas y todas las funcionalidades administrativas. Es el único rol que puede gestionar la configuración del sistema.'
            },
            {
                name: 'Vendedor',
                icon: 'pi pi-shopping-cart',
                description: 'Rol unificado para ventas y caja. Acceso a POS, gestión de ventas, créditos, movimientos de caja, métodos de pago y consulta de clientes. Puede consultar stock pero no modificarlo.'
            },
            {
                name: 'Logística',
                icon: 'pi pi-truck',
                description: 'Responsable del inventario completo. Gestiona productos, stock, ajustes, transferencias, almacenes, compras y proveedores. No tiene acceso a ventas ni POS.'
            },
            {
                name: 'Auxiliar',
                icon: 'pi pi-user',
                description: 'Rol de apoyo con acceso básico. Puede usar el POS, consultar stock y gestionar clientes básicos. Ideal para personal nuevo o apoyo temporal.'
            }
        ]
    },
    {
        title: 'Panel Principal',
        icon: 'pi pi-home',
        features: [
            {
                name: 'Dashboard Inteligente',
                icon: 'pi pi-chart-line',
                description: 'Dashboard en tiempo real con métricas clave: ventas diarias/mensuales, valor total del inventario, productos activos/agotados, alertas de stock mínimo, productos próximos a vencer y gráficos de tendencias.'
            },
            {
                name: 'Reportes Avanzados',
                icon: 'pi pi-file-excel',
                description: 'Sistema completo de reportes con exportación a Excel. Incluye reportes de ventas, inventario, movimientos de caja, créditos por cobrar y análisis de rotación de productos.'
            }
        ]
    },
    {
        title: 'Módulo de Comercio',
        icon: 'pi pi-shopping-cart',
        features: [
            {
                name: 'POS - Punto de Venta Avanzado',
                icon: 'pi pi-desktop',
                description:
                    'Sistema POS completo con búsqueda inteligente por nombre, SKU o código de barras. Carrito dinámico, gestión de clientes en tiempo real, múltiples métodos de pago, selección de lotes/vencimientos y generación automática de comprobantes. Requiere sesión de caja activa.'
            },
            {
                name: 'Sistema de Caja Inteligente',
                icon: 'pi pi-wallet',
                description: 'Control completo de sesiones de caja con apertura/cierre de turnos, seguimiento de efectivo inicial/final, registro automático de movimientos, manejo de diferencias y soporte para múltiples cajas registradoras.'
            },
            {
                name: 'Gestión de Ventas',
                icon: 'pi pi-shopping-bag',
                description: 'Administración completa de ventas con filtros avanzados, estados de venta (Pagado/Pendiente/Anulado), comprobantes electrónicos (Ticket/Boleta/Factura) e historial detallado de transacciones.'
            },
            {
                name: 'Sistema de Créditos',
                icon: 'pi pi-credit-card',
                description: 'Gestión avanzada de créditos con dashboard especializado, control de límites por cliente, alertas de vencimiento, análisis de antigüedad de saldos, historial de pagos y reportes de cobranza.'
            },
            {
                name: 'Sistema de Cotizaciones Profesional',
                icon: 'pi pi-file-edit',
                description:
                    'Plataforma completa para crear, gestionar y aprobar cotizaciones comerciales. Estados de seguimiento (Pendiente/Aprobado/Rechazado/Vencido), conversión automática a ventas con métodos de pago, exportación en PDF/Excel, filtros avanzados y dashboard de métricas en tiempo real.'
            },
            {
                name: 'Gestión de Compras',
                icon: 'pi pi-truck',
                description: 'Sistema completo de órdenes de compra con gestión de lotes, bonificaciones, control de recepciones, timeline de órdenes e impresión de documentos. Incluye estadísticas detalladas de compras.'
            },
            {
                name: 'Socios Comerciales',
                icon: 'pi pi-users',
                description: 'CRUD completo de clientes y proveedores con historial de transacciones, gestión de documentos de identidad, límites de crédito personalizados y estados de cuenta detallados.'
            }
        ]
    },
    {
        title: 'Módulo de Inventario',
        icon: 'pi pi-box',
        features: [
            {
                name: 'Gestión de Productos',
                icon: 'pi pi-tags',
                description: 'Catálogo completo con importación masiva desde Excel, gestión de SKU/códigos de barras, categorización avanzada, múltiples precios por producto, control de imágenes, unidades de medida y estados de productos.'
            },
            {
                name: 'Control de Stock Avanzado',
                icon: 'pi pi-list',
                description: 'Vista unificada de stock por almacén con EXPORTACIÓN E IMPORTACIÓN MASIVA desde Excel, edición masiva, filtros avanzados por categoría/estado/almacén, alertas de stock mínimo y gestión de lotes/vencimientos.'
            },
            {
                name: 'Movimientos de Stock',
                icon: 'pi pi-history',
                description: 'Historial completo con tipos: Entrada/Salida/Ajuste/Transferencia. Incluye trazabilidad por lote, reportes de movimientos y estadísticas de rotación de productos.'
            },
            {
                name: 'Ajustes de Inventario',
                icon: 'pi pi-sliders-h',
                description: 'Sistema de ajustes manuales con importación desde Excel, justificaciones obligatorias, reportes de diferencias y sistema de aprobaciones para mayor control.'
            },
            {
                name: 'Transferencias entre Almacenes',
                icon: 'pi pi-arrow-right-arrow-left',
                description: 'Sistema completo de transferencias con estados de seguimiento, confirmación de recepciones, historial detallado y control de inventario en tránsito.'
            },
            {
                name: 'Gestión Multi-Almacén',
                icon: 'pi pi-building',
                description: 'Soporte para múltiples almacenes por empresa con configuración de ubicaciones, estados individuales, capacidades y restricciones personalizables.'
            }
        ]
    },
    {
        title: 'Módulo de Administración',
        icon: 'pi pi-cog',
        features: [
            {
                name: 'Configuración Empresarial',
                icon: 'pi pi-sitemap',
                description:
                    'Gestión completa de datos empresariales con configuración de flujos de trabajo personalizables: proceso de compras (Estándar/Simplificado), requerimiento de sesión de caja, integración con SUNAT y configuración de comprobantes electrónicos.'
            },
            {
                name: 'Sistema de Usuarios y Permisos',
                icon: 'pi pi-users',
                description: 'Control granular de acceso con 4 roles optimizados: Administrador, Vendedor, Logística y Auxiliar. Gestión de perfiles personalizables, control de sesiones con JWT y refresh automático.'
            },
            {
                name: 'Configuración del Sistema',
                icon: 'pi pi-sliders-h',
                description: 'Parámetros globales del sistema incluyendo gestión de categorías de productos, unidades de medida estándar y configuraciones adaptables por empresa.'
            }
        ]
    },
    {
        title: 'Funcionalidades Especiales',
        icon: 'pi pi-star',
        features: [
            {
                name: 'Catálogo Público',
                icon: 'pi pi-globe',
                description: 'Tienda en línea pública sin autenticación, SEO optimizado con Schema.org, búsqueda inteligente, filtros por categoría, diseño responsive y URLs personalizables por almacén (/store/{warehouseId}).'
            },
            {
                name: 'Importación/Exportación Masiva',
                icon: 'pi pi-file-excel',
                description: 'Herramientas avanzadas para carga masiva: importación de productos desde Excel, export/import de inventarios completos, carga masiva de ajustes y templates predefinidos para facilitar el proceso.'
            },
            {
                name: 'Sistema de Lotes Avanzado',
                icon: 'pi pi-calendar',
                description: 'Gestión completa de fechas de vencimiento con alertas automáticas de productos próximos a vencer, selección de lotes en POS, trazabilidad completa y control FIFO/FEFO.'
            },
            {
                name: 'Configuraciones Flexibles',
                icon: 'pi pi-wrench',
                description: 'Sistema multi-empresa (tenancy), multi-almacén, flujos de trabajo adaptables, métodos de pago personalizables y configuración de procesos simplificados vs estándar según las necesidades del negocio.'
            }
        ]
    },
    {
        title: 'Flujos de Trabajo Principales',
        icon: 'pi pi-sitemap',
        features: [
            {
                name: 'Flujo de Ventas Rápidas (POS)',
                icon: 'pi pi-shopping-cart',
                description:
                    '1. Abrir sesión de caja → 2. Buscar productos (código de barras/nombre/SKU) → 3. Agregar al carrito con selección de lotes → 4. Seleccionar/crear cliente → 5. Procesar pago (múltiples métodos) → 6. Generar comprobante automático'
            },
            {
                name: 'Flujo de Cotizaciones Comerciales',
                icon: 'pi pi-file-edit',
                description:
                    '1. Crear nueva cotización con datos del cliente → 2. Agregar productos con precios personalizados → 3. Establecer fecha de validez y condiciones comerciales → 4. Generar y exportar cotización (PDF/Excel) → 5. Cliente revisa y acepta propuesta → 6. Aprobar cotización y convertir automáticamente a venta con registro de pago'
            },
            {
                name: 'Flujo de Gestión de Inventario',
                icon: 'pi pi-box',
                description:
                    '1. Importar productos masivamente desde Excel → 2. Configurar stock inicial por almacén → 3. Gestionar lotes y fechas de vencimiento → 4. Realizar ajustes cuando sea necesario → 5. Transferir entre almacenes → 6. Monitorear alertas automáticas'
            },
            {
                name: 'Flujo de Análisis de Negocio',
                icon: 'pi pi-chart-line',
                description:
                    '1. Consultar dashboard con métricas en tiempo real → 2. Generar reportes de ventas y rotación → 3. Analizar créditos y estrategias de cobranza → 4. Revisar sesiones de caja y movimientos → 5. Exportar datos para análisis externos'
            }
        ]
    }
]);
</script>

<template>
    <div class="onboarding-guide-page">
        <div class="guide-header">
            <i class="pi pi-question-circle guide-icon"></i>
            <h1 class="guide-title">Guía Completa del Sistema AlmaZen</h1>
            <p class="guide-subtitle">Manual completo de funcionalidades, roles y flujos de trabajo</p>
            <div class="guide-badges">
                <span class="badge badge-primary">4 Roles Optimizados</span>
                <span class="badge badge-success">Sistema Multi-Almacén</span>
                <span class="badge badge-info">Importación Masiva</span>
                <span class="badge badge-warning">POS Avanzado</span>
            </div>
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
    @apply text-lg text-gray-600 dark:text-gray-400 mt-2 mb-4;
}

.guide-badges {
    @apply flex flex-wrap justify-center gap-2 mt-4;
}

.badge {
    @apply px-3 py-1 rounded-full text-sm font-semibold;
}

.badge-primary {
    @apply bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200;
}

.badge-success {
    @apply bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200;
}

.badge-info {
    @apply bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200;
}

.badge-warning {
    @apply bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200;
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
