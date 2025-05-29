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
            meta: { positions: ['Administrador', 'Developer'] }, // Solo accesible por usuarios con estas posiciones
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { positions: ['Administrador', 'Developer'] }
                },
                {
                    path: '/profile',
                    name: 'profile',
                    component: () => import('@/views/users/Profile.vue'),
                    meta: { public: true } // Ruta pública
                },

                {
                    path: '/users',
                    name: 'users',
                    component: () => import('@/views/users/Users.vue'),
                    meta: { positions: ['Administrador'] } // Solo accesible por administradores
                },

                {
                    path: '/companies',
                    name: 'companies',
                    component: () => import('@/views/companies/Companies.vue'),
                    meta: { positions: ['Administrador'] } // Solo accesible por administradores
                },
                {
                    path: '/products',
                    name: 'products',
                    component: () => import('@/views/products/Products.vue'),
                    meta: { positions: ['Administrador', 'Logística'] } // Solo accesible por administradores y logística
                },
                {
                    path: '/units',
                    name: 'units',
                    component: () => import('@/views/products/Units.vue'),
                    meta: { positions: ['Developer'] } // Solo accesible por desarrolladores
                },
                {
                    path: '/categories',
                    name: 'categories',
                    component: () => import('@/views/categories/Categories.vue'),
                    meta: { positions: ['Administrador', 'Developer'] }
                },
                {
                    path: '/warehouses',
                    name: 'warehouses',
                    component: () => import('@/views/warehouses/Warehouses.vue'),
                    meta: { positions: ['Administrador', 'Logística'] }
                },
                {
                    path: '/providers',
                    name: 'providers',
                    component: () => import('@/views/providers/Providers.vue'),
                    meta: { positions: ['Administrador', 'Compras'] }
                },
                {
                    path: '/entries',
                    name: 'entries',
                    component: () => import('@/views/movements/Entry.vue'),
                    meta: { positions: ['Administrador', 'Logística'] }
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
