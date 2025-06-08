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
                    meta: { positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Logística', 'Cajero'] }
                },
                {
                    path: '/reports',
                    name: 'reports',
                    component: () => import('@/views/reports/Reports.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas', 'Compras', 'Logística'] }
                },

                // POS
                {
                    path: '/pos',
                    name: 'pos',
                    component: () => import('@/views/pos/POS.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas', 'Cajero'] }
                },
                {
                    path: '/cash-sessions',
                    name: 'cashSessions',
                    component: () => import('@/views/pos/CashSessions.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas', 'Cajero'] }
                },

                // Ventas
                {
                    path: '/sales-orders',
                    name: 'salesOrders',
                    component: () => import('@/views/sales/SalesOrders.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },
                {
                    path: '/invoices',
                    name: 'invoices',
                    component: () => import('@/views/sales/invoices/Invoices.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },
                {
                    path: '/customers',
                    name: 'customers',
                    component: () => import('@/views/customers/Customers.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },
                {
                    path: '/quotes',
                    name: 'quotes',
                    component: () => import('@/views/sales/quotes/Quotes.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Ventas'] }
                },

                // Compras
                {
                    path: '/purchase-orders',
                    name: 'purchaseOrders',
                    component: () => import('@/views/purchases/orders/PurchaseOrders.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Compras'] }
                },
                {
                    path: '/providers',
                    name: 'providers',
                    component: () => import('@/views/purchases/providers/Providers.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Compras'] }
                },
                {
                    path: '/purchase-requests',
                    name: 'purchaseRequests',
                    component: () => import('@/views/purchases/Purchase.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer', 'Administrador', 'Compras', 'Logística'] }
                },

                // Inventario
                {
                    path: '/products',
                    name: 'products',
                    component: () => import('@/views/inventory/products/Products.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística', 'Compras'] }
                },
                {
                    path: '/stock',
                    name: 'stock',
                    component: () => import('@/views/inventory/stock/Stock.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística', 'Ventas'] }
                },
                {
                    path: '/inventory-movements',
                    name: 'inventoryMovements',
                    component: () => import('@/views/movements/Entry.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },
                {
                    path: '/adjustments',
                    name: 'adjustments',
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
                    path: '/transfers',
                    name: 'transfers',
                    component: () => import('@/views/inventory/transfers/Transfers.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },

                // Logística
                {
                    path: '/warehouses',
                    name: 'warehouses',
                    component: () => import('@/views/inventory/warehouses/Warehouses.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },
                {
                    path: '/entries',
                    name: 'entries',
                    component: () => import('@/views/movements/Entry.vue'),
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },
                {
                    path: '/deliveries',
                    name: 'deliveries',
                    component: () => import('@/views/movements/Entry.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer', 'Administrador', 'Logística'] }
                },

                // Configuración - Catálogos
                {
                    path: '/categories',
                    name: 'categories',
                    component: () => import('@/views/config/categories/Categories.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/units',
                    name: 'units',
                    component: () => import('@/views/config/units/Units.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                // {
                //     path: '/payment-methods',
                //     name: 'paymentMethods',
                //     component: () => import('@/views/pages/Empty.vue'), // Placeholder until specific view is created
                //     meta: { positions: ['Developer', 'Administrador'] }
                // },

                // Administración
                {
                    path: '/companies',
                    name: 'companies',
                    component: () => import('@/views/companies/Companies.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/branches',
                    name: 'branches',
                    component: () => import('@/views/pages/Empty.vue'), // Placeholder until specific view is created
                    meta: { positions: ['Developer', 'Administrador'] }
                },
                {
                    path: '/users',
                    name: 'users',
                    component: () => import('@/views/users/Users.vue'),
                    meta: { positions: ['Developer', 'Administrador'] }
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
                },

                // User Profile
                {
                    path: '/profile',
                    name: 'profile',
                    component: () => import('@/views/users/Profile.vue'),
                    meta: { public: true }
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
