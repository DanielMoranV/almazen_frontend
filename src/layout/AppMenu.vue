<script setup>
import { useAuthStore } from '@/stores/authStore';
import { computed, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

// Estructura del menú reorganizada y mejorada
const model = ref([
    {
        label: 'Dashboard',
        items: [
            {
                label: 'Inicio',
                icon: 'pi pi-home',
                to: '/dashboard',
                positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Logística', 'Cajero']
            },
            {
                label: 'Reportes',
                icon: 'pi pi-chart-line',
                to: '/reports',
                positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Logística']
            }
        ]
    },
    {
        label: 'POS',
        items: [
            {
                label: 'Caja',
                icon: 'pi pi-desktop',
                to: '/pos',
                positions: ['Developer', 'Administrador', 'Ventas', 'Cajero']
            },
            {
                label: 'Sesiones',
                icon: 'pi pi-clock',
                to: '/cash-sessions',
                positions: ['Developer', 'Administrador', 'Ventas', 'Cajero']
            }
        ],
        positions: ['Developer', 'Administrador', 'Ventas', 'Cajero']
    },
    {
        label: 'Ventas',
        items: [
            {
                label: 'Ventas',
                icon: 'pi pi-shopping-bag',
                to: '/sales-orders',
                positions: ['Developer', 'Administrador', 'Ventas']
            },
            {
                label: 'Facturas',
                icon: 'pi pi-file-pdf',
                to: '/invoices',
                positions: ['Developer', 'Administrador', 'Ventas']
            },
            {
                label: 'Clientes',
                icon: 'pi pi-users',
                to: '/customers',
                positions: ['Developer', 'Administrador', 'Ventas']
            },
            {
                label: 'Cotizaciones',
                icon: 'pi pi-file-edit',
                to: '/quotes',
                positions: ['Developer', 'Administrador', 'Ventas']
            }
        ],
        positions: ['Developer', 'Administrador', 'Ventas']
    },
    {
        label: 'Compras',
        items: [
            {
                label: 'Compras',
                icon: 'pi pi-shopping-cart',
                to: '/purchase-orders',
                positions: ['Developer', 'Administrador', 'Compras']
            },
            {
                label: 'Proveedores',
                icon: 'pi pi-truck',
                to: '/providers',
                positions: ['Developer', 'Administrador', 'Compras']
            },
            {
                label: 'Solicitudes',
                icon: 'pi pi-send',
                to: '/purchase-requests',
                positions: ['Developer', 'Administrador', 'Compras', 'Logística']
            }
        ],
        positions: ['Developer', 'Administrador', 'Compras']
    },
    {
        label: 'Inventario',
        items: [
            {
                label: 'Productos',
                icon: 'pi pi-tags',
                to: '/products',
                positions: ['Developer', 'Administrador', 'Logística', 'Compras']
            },
            {
                label: 'Stock Actual',
                icon: 'pi pi-list',
                to: '/stock',
                positions: ['Developer', 'Administrador', 'Logística', 'Ventas']
            },
            {
                label: 'Movimientos',
                icon: 'pi pi-history',
                to: '/inventory-movements',
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Ajustes',
                icon: 'pi pi-wrench',
                items: [
                    {
                        label: 'Ajustes',
                        icon: 'pi pi-plus-circle',
                        to: '/stock-adjustments',
                        positions: ['Developer', 'Administrador', 'Logística']
                    },
                    {
                        label: 'Conteo',
                        icon: 'pi pi-calculator',
                        to: '/physical-count',
                        positions: ['Developer', 'Administrador', 'Logística']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Transferencias',
                icon: 'pi pi-arrow-right-arrow-left',
                to: '/transfers',
                positions: ['Developer', 'Administrador', 'Logística']
            }
        ],
        positions: ['Developer', 'Administrador', 'Logística']
    },
    {
        label: 'Logística',
        items: [
            {
                label: 'Almacenes',
                icon: 'pi pi-building',
                to: '/warehouses',
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Ubicaciones',
                icon: 'pi pi-map-marker',
                to: '/locations',
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Picking',
                icon: 'pi pi-box',
                to: '/picking',
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Entregas',
                icon: 'pi pi-car',
                to: '/deliveries',
                positions: ['Developer', 'Administrador', 'Logística']
            }
        ],
        positions: ['Developer', 'Administrador', 'Logística']
    },
    {
        label: 'Configuración',
        items: [
            {
                label: 'Catálogos',
                icon: 'pi pi-book',
                items: [
                    {
                        label: 'Categorías',
                        icon: 'pi pi-th-large',
                        to: '/categories',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Unidades',
                        icon: 'pi pi-sliders-h',
                        to: '/units',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Pagos',
                        icon: 'pi pi-credit-card',
                        to: '/payment-methods',
                        positions: ['Developer', 'Administrador']
                    }
                ],
                positions: ['Developer', 'Administrador']
            },
            {
                label: 'Precios',
                icon: 'pi pi-percentage',
                items: [
                    {
                        label: 'Listas',
                        icon: 'pi pi-list',
                        to: '/price-lists',
                        positions: ['Developer', 'Administrador', 'Ventas']
                    },
                    {
                        label: 'Descuentos',
                        icon: 'pi pi-minus',
                        to: '/discounts',
                        positions: ['Developer', 'Administrador', 'Ventas']
                    },
                    {
                        label: 'Promociones',
                        icon: 'pi pi-gift',
                        to: '/promotions',
                        positions: ['Developer', 'Administrador', 'Ventas']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Ventas']
            }
        ],
        positions: ['Developer', 'Administrador']
    },
    {
        label: 'Administración',
        items: [
            {
                label: 'Empresas',
                icon: 'pi pi-sitemap',
                items: [
                    {
                        label: 'Empresas',
                        icon: 'pi pi-building',
                        to: '/companies',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Sucursales',
                        icon: 'pi pi-map',
                        to: '/branches',
                        positions: ['Developer', 'Administrador']
                    }
                ],
                positions: ['Developer', 'Administrador']
            },
            {
                label: 'Usuarios',
                icon: 'pi pi-shield',
                items: [
                    {
                        label: 'Usuarios',
                        icon: 'pi pi-users',
                        to: '/users',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Roles',
                        icon: 'pi pi-key',
                        to: '/roles',
                        positions: ['Developer', 'Administrador']
                    }
                ],
                positions: ['Developer', 'Administrador']
            },
            {
                label: 'Sistema',
                icon: 'pi pi-cog',
                items: [
                    {
                        label: 'General',
                        icon: 'pi pi-sliders-v',
                        to: '/settings',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Impuestos',
                        icon: 'pi pi-percentage',
                        to: '/taxes',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Secuencias',
                        icon: 'pi pi-sort-numeric-up',
                        to: '/sequences',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Backups',
                        icon: 'pi pi-cloud-download',
                        to: '/backups',
                        positions: ['Developer']
                    }
                ],
                positions: ['Developer', 'Administrador']
            }
        ],
        positions: ['Developer', 'Administrador']
    }
]);

const authStore = useAuthStore();
const currentPosition = computed(() => authStore.currentUser?.position || '');

// Filtrar elementos según la posición del usuario
const filteredModel = computed(() => {
    const globalAccessRoles = ['Developer']; // Roles con acceso total

    const hasAccess = (positions) => {
        if (!positions) return true; // Sin restricción = accesible
        return positions.includes(currentPosition.value) || globalAccessRoles.includes(currentPosition.value);
    };

    const filterItems = (items) =>
        items
            .filter((item) => hasAccess(item.positions))
            .map((item) => ({
                ...item,
                items: item.items ? filterItems(item.items) : undefined
            }))
            .filter((item) => !item.items || item.items.length > 0); // Eliminar secciones vacías

    return model.value
        .filter((section) => hasAccess(section.positions))
        .map((section) => ({
            ...section,
            items: filterItems(section.items)
        }))
        .filter((section) => section.items && section.items.length > 0); // Eliminar secciones sin elementos
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in filteredModel" :key="item.label">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped>
.layout-menu {
    .menu-separator {
        height: 1px;
        background: var(--surface-border);
        margin: 0.5rem 0;
    }
}
</style>
