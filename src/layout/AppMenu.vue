<script setup>
import { useAuthStore } from '@/stores/authStore';
import { computed, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

// Estructura del menú reorganizada y mejorada
const model = ref([
    {
        label: 'Panel Principal',
        items: [
            {
                label: 'Dashboard',
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
        label: 'Comercio',
        items: [
            {
                label: 'Punto de Venta',
                icon: 'pi pi-desktop',
                items: [
                    {
                        label: 'POS',
                        icon: 'pi pi-desktop',
                        to: '/commerce/pos',
                        positions: ['Developer', 'Administrador', 'Ventas', 'Cajero']
                    },
                    {
                        label: 'Sesiones',
                        icon: 'pi pi-clock',
                        to: '/commerce/pos/sessions',
                        positions: ['Developer', 'Administrador', 'Ventas', 'Cajero']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Ventas', 'Cajero']
            },
            {
                label: 'Cajas',
                icon: 'pi pi-box',
                items: [
                    {
                        label: 'Movimientos de Caja',
                        icon: 'pi pi-wallet',
                        to: '/commerce/cash/movements',
                        positions: ['Developer', 'Administrador']
                    },

                    {
                        label: 'Métodos de Pago',
                        icon: 'pi pi-credit-card',
                        to: '/commerce/cash/payment-methods',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Cajas Registradoras',
                        icon: 'pi pi-desktop',
                        to: '/commerce/cash/registers',
                        positions: ['Developer', 'Administrador']
                    }
                ],
                positions: ['Developer', 'Administrador']
            },
            {
                label: 'Ventas',
                icon: 'pi pi-shopping-bag',
                items: [
                    {
                        label: 'Gestión de Ventas',
                        icon: 'pi pi-shopping-cart',
                        to: '/commerce/sales',
                        positions: ['Developer', 'Administrador', 'Ventas']
                    }
                    // {
                    //     label: 'Facturas',
                    //     icon: 'pi pi-file-pdf',
                    //     to: '/commerce/sales/invoices',
                    //     positions: ['Developer', 'Administrador', 'Ventas']
                    // },
                    // {
                    //     label: 'Cotizaciones',
                    //     icon: 'pi pi-file-edit',
                    //     to: '/commerce/sales/quotes',
                    //     positions: ['Developer', 'Administrador', 'Ventas']
                    // }
                ],
                positions: ['Developer', 'Administrador', 'Ventas']
            },
            {
                label: 'Compras',
                icon: 'pi pi-shopping-cart',
                items: [
                    {
                        label: 'Órdenes',
                        icon: 'pi pi-shopping-cart',
                        to: '/commerce/purchases/orders',
                        positions: ['Developer', 'Administrador', 'Compras']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Compras']
            },
            {
                label: 'Socios Comerciales',
                icon: 'pi pi-users',
                items: [
                    {
                        label: 'Proveedores',
                        icon: 'pi pi-truck',
                        to: '/commerce/partners/providers',
                        positions: ['Developer', 'Administrador', 'Compras']
                    },
                    {
                        label: 'Clientes',
                        icon: 'pi pi-users',
                        to: '/commerce/partners/customers',
                        positions: ['Developer', 'Administrador', 'Ventas']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Ventas', 'Compras']
            }
        ],
        positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Cajero']
    },
    {
        label: 'Inventario',
        items: [
            {
                label: 'Productos',
                icon: 'pi pi-tags',
                to: '/inventory/products',
                positions: ['Developer', 'Administrador', 'Logística', 'Compras']
            },
            {
                label: 'Stock Actual',
                icon: 'pi pi-list',
                to: '/inventory/stock',
                positions: ['Developer', 'Administrador', 'Logística', 'Ventas']
            },
            {
                label: 'Movimientos Stock',
                icon: 'pi pi-history',
                to: '/inventory/movements/stocks',
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Almacenes',
                icon: 'pi pi-building',
                to: '/inventory/warehouses',
                positions: ['Developer', 'Administrador', 'Logística']
            }
            // {
            //     label: 'Ajustes',
            //     icon: 'pi pi-wrench',
            //     items: [
            //         {
            //             label: 'Ajustes',
            //             icon: 'pi pi-plus-circle',
            //             to: '/adjustments',
            //             positions: ['Developer', 'Administrador', 'Logística']
            //         },
            //         {
            //             label: 'Conteo',
            //             icon: 'pi pi-calculator',
            //             to: '/physical-count',
            //             positions: ['Developer', 'Administrador', 'Logística']
            //         }
            //     ],
            //     positions: ['Developer', 'Administrador', 'Logística']
            // },
            // {
            //     label: 'Transferencias',
            //     icon: 'pi pi-arrow-right-arrow-left',
            //     to: '/transfers',
            //     positions: ['Developer', 'Administrador', 'Logística']
            // }
        ],
        positions: ['Developer', 'Administrador', 'Logística']
    },
    {
        label: 'Administración',
        items: [
            {
                label: 'Empresa',
                icon: 'pi pi-sitemap',
                items: [
                    {
                        label: 'Empresas',
                        icon: 'pi pi-building',
                        to: '/administration/companies',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Configuración',
                        icon: 'pi pi-cog',
                        to: '/administration/companies/config',
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
                        to: '/administration/users',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Perfil',
                        icon: 'pi pi-user',
                        to: '/administration/users/profile',
                        positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Logística', 'Cajero']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Logística', 'Cajero']
            },
            {
                label: 'Sistema',
                icon: 'pi pi-sliders-h',
                items: [
                    {
                        label: 'Categorías',
                        icon: 'pi pi-th-large',
                        to: '/administration/system/categories',
                        positions: ['Developer', 'Administrador']
                    },
                    {
                        label: 'Unidades',
                        icon: 'pi pi-sliders-h',
                        to: '/administration/system/units',
                        positions: ['Developer', 'Administrador']
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
