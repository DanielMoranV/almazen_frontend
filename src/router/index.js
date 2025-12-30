import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/authStore';
import { createRouter, createWebHistory } from 'vue-router';

// Definimos las rutas con permisos de acceso
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/dashboard',
            component: AppLayout,
            meta: { positions: ['Administrador', 'Developer'] },
            children: [
                // Dashboard
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: {
                        positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Logística', 'Cajero']
                    }
                },
                {
                    path: '/onboarding-guide',
                    name: 'onboarding-guide',
                    component: () => import('@/views/pages/OnboardingGuide.vue'),
                    meta: {
                        positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Logística', 'Cajero']
                    }
                },
                {
                    path: '/reports',
                    name: 'reports',
                    component: () => import('@/views/reports/Reports.vue'),
                    meta: {
                        positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Logística']
                    }
                },

                // Commerce - Ventas
                {
                    path: '/commerce/sales',
                    name: 'sales',
                    component: () => import('@/views/commerce/sales/Sales.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },
                {
                    path: '/commerce/sales/invoices',
                    name: 'invoices',
                    component: () => import('@/views/commerce/sales/invoices/Invoices.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },
                {
                    path: '/commerce/sales/quotes',
                    name: 'quotes',
                    component: () => import('@/views/commerce/sales/quotes/Quotes.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },
                {
                    path: '/commerce/sales/discount-codes',
                    name: 'discount-codes',
                    component: () => import('@/views/sales/discounts/DiscountCodes.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Gerente'] }
                },

                // Commerce - Partners
                {
                    path: '/commerce/partners/customers',
                    name: 'customers',
                    component: () => import('@/views/commerce/partners/customers/Customers.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },
                {
                    path: '/commerce/partners/providers',
                    name: 'providers',
                    component: () => import('@/views/commerce/partners/providers/Providers.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Compras'] }
                },

                // Commerce - Créditos
                {
                    path: '/commerce/credits',
                    name: 'credits',
                    component: () => import('@/views/commerce/credits/Credits.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },
                {
                    path: '/commerce/credits/dashboard',
                    name: 'creditsDashboard',
                    component: () => import('@/views/commerce/credits/CreditsDashboard.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },

                // Commerce - Compras
                {
                    path: '/commerce/purchases/orders',
                    name: 'purchaseOrders',
                    component: () => import('@/views/commerce/purchases/orders/PurchaseOrders.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Compras'] }
                },

                // Commerce - POS
                {
                    path: '/commerce/pos',
                    name: 'pos',
                    component: () => import('@/views/commerce/pos/POS.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas', 'Cajero'] }
                },
                {
                    path: '/commerce/pos/sessions',
                    name: 'cashSessions',
                    component: () => import('@/views/commerce/pos/CashSessions.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas', 'Cajero'] }
                },

                // Commerce - Cash Management
                {
                    path: '/commerce/cash/payment-methods',
                    name: 'paymentMethods',
                    component: () => import('@/views/commerce/cash/PaymentMethods.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/commerce/cash/registers',
                    name: 'cashRegisters',
                    component: () => import('@/views/commerce/cash/CashRegisters.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/commerce/cash/movements',
                    name: 'cashMovements',
                    component: () => import('@/views/commerce/cash/CashMovements.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },

                // Inventario
                {
                    path: '/inventory/products',
                    name: 'products',
                    component: () => import('@/views/inventory/products/Products.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística', 'Compras'] }
                },
                {
                    path: '/inventory/catalogs',
                    name: 'catalogs',
                    component: () => import('@/views/inventory/catalogs/Catalogs.vue'),
                    meta: { 
                        positions: ['Developer', 'Administrador', 'Logística'],
                        title: 'Catálogos de Productos',
                        description: 'Gestión de galerías de imágenes de productos'
                    }
                },
                {
                    path: '/inventory/stock',
                    name: 'stock',
                    component: () => import('@/views/inventory/stock/Stock.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística', 'Ventas'] }
                },
                {
                    path: '/inventory/movements/stocks',
                    name: 'inventoryMovements',
                    component: () => import('@/views/inventory/movements/Stocks.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },
                {
                    path: '/adjustments',
                    name: 'adjustments',
                    component: () => import('@/views/inventory/adjustments/Adjustments.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },
                {
                    path: '/inventory/adjustments/stock',
                    name: 'stockAdjustments',
                    component: () => import('@/views/inventory/adjustments/Adjustments.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },
                {
                    path: '/physical-count',
                    name: 'physicalCount',
                    component: () => import('@/views/inventory/stock/Stock.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },
                {
                    path: '/inventory/transfers',
                    name: 'transfers',
                    component: () => import('@/views/inventory/transfers/StockTransfers.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },

                // Logística
                {
                    path: '/inventory/warehouses',
                    name: 'warehouses',
                    component: () => import('@/views/inventory/warehouses/Warehouses.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },
                // 🆕 NUEVO: Administración de Catálogos Públicos
                {
                    path: '/inventory/warehouses/catalogs',
                    name: 'publicCatalogs',
                    component: () => import('@/views/inventory/warehouses/PublicCatalogs.vue'),
                    meta: {
                        positions: ['Developer', 'Administrador', 'Logística'],
                        title: 'Catálogos Públicos',
                        description: 'Gestión de catálogos públicos con URLs amigables'
                    }
                },

                // Administración - Sistema
                {
                    path: '/administration/system/categories',
                    name: 'categories',
                    component: () => import('@/views/administration/system/categories/Categories.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/administration/system/units',
                    name: 'units',
                    component: () => import('@/views/administration/system/units/Units.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                // {
                //     path: '/payment-methods',
                //     name: 'paymentMethods',
                //     component: () => import('@/views/pages/Empty.vue'), // Placeholder until specific view is created
                //     meta: { positions: ['Developer', 'Administrador'] }
                // },

                // Administración - Empresas
                {
                    path: '/administration/companies',
                    name: 'companies',
                    component: () => import('@/views/administration/companies/Companies.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/administration/companies/config',
                    name: 'companyConfig',
                    component: () => import('@/views/administration/companies/config/CompanyConfig.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },

                // Administración - Usuarios
                {
                    path: '/administration/users',
                    name: 'users',
                    component: () => import('@/views/administration/users/Users.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/administration/users/profile',
                    name: 'profile',
                    component: () => import('@/views/administration/users/Profile.vue'),
                    meta: { public: true }
                },
                {
                    path: '/roles',
                    name: 'roles',
                    component: () => import('@/views/pages/Empty.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/settings',
                    name: 'settings',
                    component: () => import('@/views/pages/Empty.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/taxes',
                    name: 'taxes',
                    component: () => import('@/views/pages/Empty.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/sequences',
                    name: 'sequences',
                    component: () => import('@/views/pages/Empty.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/backups',
                    name: 'backups',
                    component: () => import('@/views/pages/Empty.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer'] }
                }
            ]
        },
        {
            path: '/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue'),
            meta: { public: true } // Ruta pública
        },

        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/auth/Register.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/auth/Login.vue'),
            meta: { public: true } // Ruta pública
        },
        // 🆕 NUEVO: Rutas con URLs Amigables (Slugs)
        {
            path: '/tienda/:slug',
            name: 'catalogHome',
            component: () => import('@/views/public/Store.vue'),
            meta: {
                public: true,
                title: 'Catálogo de Productos',
                description: 'Descubre nuestros productos'
            }
        },
        {
            path: '/tienda/:slug/productos/:productId',
            name: 'catalogProductDetail',
            component: () => import('@/views/public/ProductDetail.vue'),
            meta: {
                public: true,
                title: 'Producto',
                description: 'Detalles del producto'
            }
        },

        // 🔄 LEGACY: Rutas Antiguas (Mantener para retrocompatibilidad - DEPRECATED)
        {
            path: '/store/:companyId/:warehouseId',
            name: 'publicStore',
            component: () => import('@/views/public/Store.vue'),
            meta: {
                public: true,
                deprecated: true,
                redirectTo: 'catalogHome'
            }
        },
        {
            path: '/store/:companyId/:warehouseId/product/:productId',
            name: 'publicProductDetail',
            component: () => import('@/views/public/ProductDetail.vue'),
            meta: {
                public: true,
                deprecated: true,
                redirectTo: 'catalogProductDetail'
            }
        },

        {
            path: '/accessdenied',
            name: 'accessDenied',
            component: () => import('@/views/auth/Access.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/error',
            name: 'error',
            component: () => import('@/views/auth/Error.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/:catchAll(.*)',
            redirect: '/notfound',
            meta: { public: true } // Ruta pública
        }
    ]
});

// Guard de navegación
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const currentUser = authStore.currentUser;

    // Si la ruta es pública, permite el acceso sin verificación
    if (to.meta.public) {
        return next();
    }

    // Verifica si el usuario está autenticado
    if (!currentUser || !currentUser.is_active) {
        return next({ name: 'login' });
    }

    // Verifica si la ruta requiere posiciones específicas
    const allowedPositions = to.meta.positions;
    if (allowedPositions && !allowedPositions.includes(currentUser.position) && currentUser.position !== 'Developer') {
        return next({ name: 'accessDenied' });
    }

    next(); // Permite la navegación
});

export default router;
