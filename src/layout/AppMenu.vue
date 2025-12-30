<script setup>
import { useAuthStore } from '@/stores/authStore';
import { computed, ref, watch } from 'vue';
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
                positions: ['Developer', 'Administrador', 'Vendedor', 'Logística', 'Auxiliar']
            },
            {
                label: 'Reportes',
                icon: 'pi pi-chart-line',
                to: '/reports',
                positions: ['Developer', 'Administrador']
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
                        positions: ['Developer', 'Administrador', 'Vendedor', 'Auxiliar']
                    },
                    {
                        label: 'Sesiones',
                        icon: 'pi pi-clock',
                        to: '/commerce/pos/sessions',
                        positions: ['Developer', 'Administrador', 'Vendedor']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Vendedor', 'Auxiliar']
            },
            {
                label: 'Cajas',
                icon: 'pi pi-box',
                items: [
                    {
                        label: 'Movimientos de Caja',
                        icon: 'pi pi-wallet',
                        to: '/commerce/cash/movements',
                        positions: ['Developer', 'Administrador', 'Vendedor']
                    },

                    {
                        label: 'Métodos de Pago',
                        icon: 'pi pi-credit-card',
                        to: '/commerce/cash/payment-methods',
                        positions: ['Developer', 'Administrador', 'Vendedor']
                    },
                    {
                        label: 'Cajas Registradoras',
                        icon: 'pi pi-desktop',
                        to: '/commerce/cash/registers',
                        positions: ['Developer', 'Administrador']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Vendedor']
            },
            {
                label: 'Ventas',
                icon: 'pi pi-shopping-bag',
                items: [
                    {
                        label: 'Gestión de Ventas',
                        icon: 'pi pi-shopping-cart',
                        to: '/commerce/sales',
                        positions: ['Developer', 'Administrador', 'Vendedor']
                    },
                    {
                        label: 'Cotizaciones',
                        icon: 'pi pi-file-edit',
                        to: '/commerce/sales/quotes',
                        positions: ['Developer', 'Administrador', 'Vendedor']
                    },
                    {
                        label: 'Códigos de Descuento',
                        icon: 'pi pi-percentage',
                        to: '/commerce/sales/discount-codes',
                        positions: ['Developer', 'Administrador', 'Gerente']
                    }
                    // {
                    //     label: 'Facturas',
                    //     icon: 'pi pi-file-pdf',
                    //     to: '/commerce/sales/invoices',
                    //     positions: ['Developer', 'Administrador', 'Ventas']
                    // }
                ],
                positions: ['Developer', 'Administrador', 'Vendedor']
            },
            {
                label: 'Compras',
                icon: 'pi pi-shopping-cart',
                items: [
                    {
                        label: 'Órdenes',
                        icon: 'pi pi-shopping-cart',
                        to: '/commerce/purchases/orders',
                        positions: ['Developer', 'Administrador', 'Logística']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Créditos',
                icon: 'pi pi-credit-card',
                items: [
                    {
                        label: 'Gestión de Créditos',
                        icon: 'pi pi-list',
                        to: '/commerce/credits',
                        positions: ['Developer', 'Administrador', 'Vendedor']
                    },
                    {
                        label: 'Dashboard de Créditos',
                        icon: 'pi pi-chart-line',
                        to: '/commerce/credits/dashboard',
                        positions: ['Developer', 'Administrador', 'Vendedor']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Vendedor']
            },
            {
                label: 'Socios Comerciales',
                icon: 'pi pi-users',
                items: [
                    {
                        label: 'Proveedores',
                        icon: 'pi pi-truck',
                        to: '/commerce/partners/providers',
                        positions: ['Developer', 'Administrador', 'Logística']
                    },
                    {
                        label: 'Clientes',
                        icon: 'pi pi-users',
                        to: '/commerce/partners/customers',
                        positions: ['Developer', 'Administrador', 'Vendedor', 'Auxiliar']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Vendedor', 'Logística', 'Auxiliar']
            }
        ],
        positions: ['Developer', 'Administrador', 'Vendedor', 'Logística', 'Auxiliar']
    },
    {
        label: 'Inventario',
        items: [
            {
                label: 'Productos',
                icon: 'pi pi-tags',
                to: '/inventory/products',
                positions: ['Developer', 'Administrador', 'Gerente', 'Almacenista', 'Comprador']
            },
            {
                label: 'Catálogos',
                icon: 'pi pi-images',
                to: '/inventory/catalogs',
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Stock Actual',
                icon: 'pi pi-list',
                to: '/inventory/stock',
                positions: ['Developer', 'Administrador', 'Vendedor', 'Logística', 'Auxiliar']
            },
            {
                label: 'Movimientos Stock',
                icon: 'pi pi-history',
                to: '/inventory/movements/stocks',
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Ajustes de Stock',
                icon: 'pi pi-sliders-h',
                to: '/inventory/adjustments/stock',
                positions: ['Developer', 'Administrador', 'Logística']
            },
            {
                label: 'Almacenes',
                icon: 'pi pi-building',
                to: '/inventory/warehouses',
                positions: ['Developer', 'Administrador', 'Logística']
            },
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
            {
                label: 'Transferencias',
                icon: 'pi pi-arrow-right-arrow-left',
                to: '/inventory/transfers',
                positions: ['Developer', 'Administrador', 'Logística']
            }
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
                        positions: ['Developer', 'Administrador', 'Vendedor', 'Logística', 'Auxiliar']
                    }
                ],
                positions: ['Developer', 'Administrador', 'Vendedor', 'Logística', 'Auxiliar']
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
    },
    {
        label: 'Ayuda',
        items: [
            {
                label: 'Guía de Inicio',
                icon: 'pi pi-question-circle',
                to: '/onboarding-guide',
                positions: ['Developer', 'Administrador', 'Vendedor', 'Logística', 'Auxiliar']
            }
        ]
    }
]);

const authStore = useAuthStore();
const currentPosition = computed(() => authStore.currentUser?.position || '');

// Estado de búsqueda
const searchTerm = ref('');
const searchResults = ref([]);

// Función para buscar en items anidados
const searchInItems = (items, term) => {
    const results = [];

    const searchRecursive = (itemsList, parentPath = []) => {
        itemsList.forEach((item) => {
            const currentPath = [...parentPath, item.label];

            // Verificar si el item actual coincide con la búsqueda
            if (item.label.toLowerCase().includes(term.toLowerCase())) {
                results.push({
                    ...item,
                    searchPath: currentPath.join(' > '),
                    matchedText: item.label
                });
            }

            // Buscar en sub-items si existen
            if (item.items && item.items.length > 0) {
                searchRecursive(item.items, currentPath);
            }
        });
    };

    searchRecursive(items);
    return results;
};

// Función para limpiar búsqueda
const clearSearch = () => {
    searchTerm.value = '';
    searchResults.value = [];
};

// Watcher para búsqueda en tiempo real
watch(searchTerm, (newTerm) => {
    if (newTerm.trim().length >= 2) {
        const allAccessibleItems = filteredModel.value.flatMap((section) => section.items);
        searchResults.value = searchInItems(allAccessibleItems, newTerm);
    } else {
        searchResults.value = [];
    }
});

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

// Computed para mostrar menú o resultados de búsqueda
const displayModel = computed(() => {
    if (searchResults.value.length > 0) {
        return [
            {
                label: `Resultados de búsqueda (${searchResults.value.length})`,
                items: searchResults.value.map((result) => ({
                    ...result,
                    searchHighlight: true
                }))
            }
        ];
    }
    return filteredModel.value;
});
</script>

<template>
    <div class="menu-container">
        <!-- Campo de búsqueda -->
        <div class="menu-search-container">
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="searchTerm" placeholder="Buscar en el menú..." class="menu-search-input" @keyup.escape="clearSearch" />
            </IconField>
            <button v-if="searchTerm" @click="clearSearch" class="menu-search-clear" type="button">
                <i class="pi pi-times"></i>
            </button>
        </div>

        <!-- Menú -->
        <ul class="layout-menu">
            <template v-for="(item, i) in displayModel" :key="item.label">
                <app-menu-item v-if="!item.separator" :item="item" :index="i" :search-highlight="item.searchHighlight"></app-menu-item>
                <li v-if="item.separator" class="menu-separator"></li>
            </template>
        </ul>

        <!-- Mensaje cuando no hay resultados -->
        <div v-if="searchTerm && searchResults.length === 0" class="no-results">
            <i class="pi pi-search"></i>
            <span>No se encontraron resultados para "{{ searchTerm }}"</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.menu-container {
    .menu-search-container {
        position: relative;
        padding: 1rem;
        border-bottom: 1px solid var(--surface-border);

        .p-input-icon-left {
            width: 100%;

            i {
                color: var(--text-color-secondary);
            }
        }

        .menu-search-input {
            width: 100%;
            padding: 0.5rem 2.5rem 0.5rem 2rem;
            border: 1px solid var(--surface-border);
            border-radius: 6px;
            background: var(--surface-ground);
            color: var(--text-color);
            font-size: 0.875rem;

            &:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 0.2rem rgba(var(--primary-color-rgb), 0.2);
            }

            &::placeholder {
                color: var(--text-color-secondary);
            }
        }

        .menu-search-clear {
            position: absolute;
            right: 1.5rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-color-secondary);
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 50%;

            &:hover {
                background: var(--surface-hover);
                color: var(--text-color);
            }
        }
    }

    .layout-menu {
        .menu-separator {
            height: 1px;
            background: var(--surface-border);
            margin: 0.5rem 0;
        }
    }

    .no-results {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        color: var(--text-color-secondary);
        text-align: center;

        i {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            opacity: 0.5;
        }

        span {
            font-size: 0.875rem;
        }
    }
}
</style>
