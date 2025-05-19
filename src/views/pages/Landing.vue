<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
    <div class="min-h-screen flex flex-col bg-white text-gray-800">
        <!-- Header -->
        <header class="flex justify-between items-center px-6 py-4 shadow-md">
            <div class="flex justify-center">
                <RouterLink to="/">
                    <img src="/images/almazenlogo.png" alt="Logo" class="h-14 object-contain cursor-pointer" />
                </RouterLink>
            </div>
            <nav class="space-x-4">
                <RouterLink to="/login" class="text-gray-700 hover:text-green-600 font-medium">Iniciar sesión</RouterLink>
                <RouterLink to="/register" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"> Registrarse </RouterLink>
            </nav>
        </header>

        <!-- Hero -->
        <section class="text-center py-20 bg-gray-50 px-6">
            <h2 class="text-4xl md:text-5xl font-bold mb-4">Gestiona tu almacén de forma moderna</h2>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-8">Controla tu inventario, ventas y más desde un solo lugar. Ideal para negocios de cualquier tamaño.</p>
            <RouterLink to="/register" class="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition"> Empezar ahora </RouterLink>
        </section>

        <!-- Características -->
        <section class="py-16 px-6 bg-white text-center">
            <h3 class="text-3xl font-bold mb-12">¿Por qué elegir AlmaZen?</h3>
            <div class="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                <div>
                    <div class="text-green-600 text-5xl mb-4">📦</div>
                    <h4 class="text-xl font-semibold mb-2">Inventario en tiempo real</h4>
                    <p class="text-gray-600">Consulta y gestiona tus productos al instante, sin errores ni demoras.</p>
                </div>
                <div>
                    <div class="text-green-600 text-5xl mb-4">📈</div>
                    <h4 class="text-xl font-semibold mb-2">Reportes inteligentes</h4>
                    <p class="text-gray-600">Visualiza tus ventas, compras y movimientos con estadísticas claras.</p>
                </div>
                <div>
                    <div class="text-green-600 text-5xl mb-4">🔒</div>
                    <h4 class="text-xl font-semibold mb-2">Seguridad y control</h4>
                    <p class="text-gray-600">Sistema con roles de usuario, auditoría y respaldo automático.</p>
                </div>
            </div>
        </section>

        <!-- Testimonios -->
        <section class="py-16 px-6 bg-gray-50 text-center">
            <h3 class="text-3xl font-bold mb-12">Lo que dicen nuestros usuarios</h3>
            <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div class="bg-white shadow-md p-6 rounded-lg">
                    <p class="italic text-gray-600 mb-4">"Desde que usamos AlmaZen, nuestro control de stock ha mejorado muchísimo. 100% recomendado."</p>
                    <h5 class="font-bold text-green-700">María Gómez</h5>
                    <p class="text-sm text-gray-500">Dueña de Bodega Los Andes</p>
                </div>
                <div class="bg-white shadow-md p-6 rounded-lg">
                    <p class="italic text-gray-600 mb-4">"Fácil de usar y muy completo. Ideal para pequeños negocios como el mío."</p>
                    <h5 class="font-bold text-green-700">Juan Pérez</h5>
                    <p class="text-sm text-gray-500">Tienda Pérez Express</p>
                </div>
                <div class="bg-white shadow-md p-6 rounded-lg">
                    <p class="italic text-gray-600 mb-4">"Nos permitió crecer sin perder el control. El mejor sistema que hemos probado."</p>
                    <h5 class="font-bold text-green-700">Carmen Rodríguez</h5>
                    <p class="text-sm text-gray-500">Minimarket La Estrella</p>
                </div>
            </div>
        </section>

        <!-- Precios -->
        <section class="py-16 px-6 bg-white text-center">
            <h3 class="text-3xl font-bold mb-12">Planes de precios</h3>
            <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div class="border rounded-lg p-6 shadow-md">
                    <h4 class="text-xl font-semibold mb-2">Gratis</h4>
                    <p class="text-3xl font-bold text-green-600 mb-4">S/ 0</p>
                    <p class="text-gray-600 mb-4">Para emprendedores que recién comienzan</p>
                    <ul class="text-left text-gray-700 space-y-2 mb-4">
                        <li>✔ Hasta 50 productos</li>
                        <li>✔ 1 usuario</li>
                        <li>✔ Reportes básicos</li>
                    </ul>
                    <RouterLink to="/register" class="block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"> Empezar gratis </RouterLink>
                </div>
                <div class="border rounded-lg p-6 shadow-md bg-green-50">
                    <h4 class="text-xl font-semibold mb-2">Profesional</h4>
                    <p class="text-3xl font-bold text-green-600 mb-4">S/ 39</p>
                    <p class="text-gray-600 mb-4">Ideal para negocios en crecimiento</p>
                    <ul class="text-left text-gray-700 space-y-2 mb-4">
                        <li>✔ Productos ilimitados</li>
                        <li>✔ Hasta 5 usuarios</li>
                        <li>✔ Reportes completos</li>
                    </ul>
                    <RouterLink to="/register" class="block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"> Probar ahora </RouterLink>
                </div>
                <div class="border rounded-lg p-6 shadow-md">
                    <h4 class="text-xl font-semibold mb-2">Empresarial</h4>
                    <p class="text-3xl font-bold text-green-600 mb-4">S/ 79</p>
                    <p class="text-gray-600 mb-4">Para empresas con múltiples almacenes</p>
                    <ul class="text-left text-gray-700 space-y-2 mb-4">
                        <li>✔ Multi-almacén</li>
                        <li>✔ Usuarios ilimitados</li>
                        <li>✔ Soporte prioritario</li>
                    </ul>
                    <RouterLink to="/register" class="block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"> Contactar ventas </RouterLink>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-8 px-6 text-center mt-auto">
            <p class="mb-2">© 2025 Djasoft. Todos los derechos reservados.</p>
            <p class="text-sm text-gray-400">Desarrollado con ❤️ para emprendedores peruanos.</p>
        </footer>
    </div>
</template>
