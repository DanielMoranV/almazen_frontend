<script>
export default {
    name: 'LandingPage',
    data() {
        return {
            features: [
                {
                    icon: 'pi-box',
                    title: 'Control de Inventario Avanzado',
                    description: 'Gestiona productos, stock por almacén, lotes y movimientos con precisión total.'
                },
                {
                    icon: 'pi-desktop',
                    title: 'Punto de Venta Intuitivo (POS)',
                    description: 'Realiza ventas rápidas, gestiona pagos y sesiones de caja de forma eficiente.'
                },
                {
                    icon: 'pi-shopping-cart',
                    title: 'Gestión Integral de Compras',
                    description: 'Controla todo el ciclo de compras, desde órdenes hasta recepción y proveedores.'
                },
                {
                    icon: 'pi-chart-line',
                    title: 'Reportes y Análisis en Tiempo Real',
                    description: 'Accede a un dashboard y reportes detallados para una toma de decisiones informada.'
                },
                {
                    icon: 'pi-users',
                    title: 'Administración de Usuarios y Clientes',
                    description: 'Gestiona usuarios, roles, clientes y proveedores con total facilidad.'
                },
                {
                    icon: 'pi-cog',
                    title: 'Configuración Flexible',
                    description: 'Adapta el sistema a las necesidades específicas de tu empresa y roles de usuario.'
                }
            ],
            stats: [
                { number: 'BETA', label: 'En desarrollo activo' },
                { number: '2025', label: 'Próximo lanzamiento' },
                { number: '24/7', label: 'Soporte en desarrollo' },
                { number: '100%', label: 'Funcionalidad garantizada' }
            ]
        };
    }
};
</script>

<template>
    <div class="landing-page">
        <!-- Hero Section with animated background -->
        <div class="hero-section">
            <div class="animated-bg">
                <div class="floating-shape shape-1"></div>
                <div class="floating-shape shape-2"></div>
                <div class="floating-shape shape-3"></div>
                <div class="floating-shape shape-4"></div>
            </div>

            <div class="hero-content">
                <div class="landing-header">
                    <div class="logo-container">
                        <img src="/images/almazenlogo.png" alt="Almazen" class="logo" />
                        <div class="logo-glow"></div>
                    </div>
                    <h1 class="main-title">
                        <span class="title-line">Bienvenido a</span>
                        <span class="title-brand">Almazen</span>
                    </h1>
                    <p class="hero-subtitle">Sistema de Gestión de Inventarios y Compras</p>
                    <div class="hero-badge">
                        <span class="beta-badge">BETA</span>
                        <span class="badge-text">Próximamente disponible</span>
                    </div>
                </div>

                <div class="landing-actions">
                    <Button label="Iniciar Sesión" @click="$router.push('/login')" icon="pi pi-sign-in" size="large" class="primary-button" />
                    <Button label="Registrarse" @click="$router.push('/register')" icon="pi pi-user-plus" severity="secondary" outlined size="large" class="secondary-button" />
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div class="features-section">
            <div class="section-header">
                <h2 class="features-title">Características Principales</h2>
                <p class="features-subtitle">Descubre todo lo que Almazen puede hacer por tu negocio</p>
            </div>

            <div class="features-grid">
                <div class="feature-card" v-for="(feature, index) in features" :key="index" :style="{ animationDelay: `${index * 0.1}s` }">
                    <div class="feature-icon-container">
                        <i :class="`pi ${feature.icon} feature-icon`"></i>
                        <div class="icon-bg"></div>
                    </div>
                    <h3>{{ feature.title }}</h3>
                    <p>{{ feature.description }}</p>
                    <div class="feature-accent"></div>
                </div>
            </div>
        </div>

        <!-- Stats Section -->
        <div class="stats-section">
            <div class="stats-container">
                <div class="stat-item" v-for="(stat, index) in stats" :key="index">
                    <div class="stat-number">{{ stat.number }}</div>
                    <div class="stat-label">{{ stat.label }}</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="landing-footer">
            <p>&copy; 2025 Almazen. Todos los derechos reservados.</p>
        </div>
    </div>
</template>

<style scoped>
.landing-page {
    overflow-x: hidden;
    font-family:
        'Inter',
        -apple-system,
        BlinkMacSystemFont,
        sans-serif;
}

/* Hero Section */
.hero-section {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #2d8f3f 0%, #f4b942 50%, #2d8f3f 100%);
    overflow: hidden;
}

.animated-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
}

.floating-shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    animation: float 6s ease-in-out infinite;
    box-shadow: 0 8px 32px rgba(45, 143, 63, 0.3);
}

.shape-1 {
    width: 100px;
    height: 100px;
    top: 20%;
    left: 10%;
    animation-delay: 0s;
}

.shape-2 {
    width: 60px;
    height: 60px;
    top: 60%;
    right: 20%;
    animation-delay: 2s;
}

.shape-3 {
    width: 80px;
    height: 80px;
    bottom: 30%;
    left: 80%;
    animation-delay: 4s;
}

.shape-4 {
    width: 120px;
    height: 120px;
    top: 10%;
    right: 10%;
    animation-delay: 1s;
}

@keyframes float {
    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }
    50% {
        transform: translateY(-20px) rotate(180deg);
    }
}

.hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 2rem;
    max-width: 800px;
}

.landing-header {
    margin-bottom: 3rem;
}

.logo-container {
    position: relative;
    display: inline-block;
    margin-bottom: 2rem;
}

.logo {
    width: 120px;
    height: auto;
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
    animation: logoFloat 3s ease-in-out infinite;
}

.logo-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 140px;
    height: 140px;
    background: radial-gradient(circle, rgba(244, 185, 66, 0.4) 0%, rgba(45, 143, 63, 0.2) 50%, transparent 70%);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes logoFloat {
    0%,
    100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-10px);
    }
}

@keyframes pulse {
    0%,
    100% {
        opacity: 0.5;
        transform: translate(-50%, -50%) scale(1);
    }
    50% {
        opacity: 0.8;
        transform: translate(-50%, -50%) scale(1.1);
    }
}

.main-title {
    margin: 0 0 1rem 0;
    font-weight: 700;
}

.title-line {
    display: block;
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 0.5rem;
    animation: slideInUp 1s ease forwards;
    opacity: 0;
}

.title-brand {
    display: block;
    font-size: 4rem;
    background: linear-gradient(45deg, #fff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: slideInUp 1s ease 0.2s forwards;
    opacity: 0;
}

.hero-subtitle {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 2rem 0;
    animation: slideInUp 1s ease 0.4s forwards;
    opacity: 0;
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    padding: 0.5rem 1rem;
    margin-bottom: 2rem;
    animation: slideInUp 1s ease 0.6s forwards;
    opacity: 0;
}

.beta-badge {
    background: linear-gradient(45deg, #f4b942, #e5a635);
    color: #1a5021;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 12px rgba(244, 185, 66, 0.4);
}

.badge-text {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.landing-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
    animation: slideInUp 1s ease 0.8s forwards;
    opacity: 0;
}

.primary-button {
    background: linear-gradient(45deg, #2d8f3f, #1e5f2a) !important;
    border: none !important;
    transform: scale(1);
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(45, 143, 63, 0.4);
}

.primary-button:hover {
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 10px 30px rgba(45, 143, 63, 0.5);
    background: linear-gradient(45deg, #1e5f2a, #0f3d17) !important;
}

.secondary-button {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1) !important;
    border: 2px solid rgba(255, 255, 255, 0.3) !important;
    color: white !important;
    transform: scale(1);
    transition: all 0.3s ease;
}

.secondary-button:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
}

/* Features Section */
.features-section {
    padding: 5rem 2rem;
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    position: relative;
}

.section-header {
    text-align: center;
    margin-bottom: 4rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.features-title {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(45deg, #2d8f3f, #f4b942, #2d8f3f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
}

.features-subtitle {
    font-size: 1.2rem;
    color: #64748b;
    margin: 0;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.feature-card {
    background: white;
    border-radius: 20px;
    padding: 2.5rem 2rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(45, 143, 63, 0.1);
    animation: fadeInUp 0.6s ease forwards;
    opacity: 0;
    transform: translateY(30px);
}

@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.feature-card:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 60px rgba(45, 143, 63, 0.15);
    border-color: rgba(244, 185, 66, 0.3);
}

.feature-card:hover .feature-icon {
    transform: scale(1.1) rotate(5deg);
}

.feature-icon-container {
    position: relative;
    margin-bottom: 1.5rem;
}

.feature-icon {
    font-size: 3.5rem;
    background: linear-gradient(45deg, #2d8f3f, #f4b942, #2d8f3f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
    z-index: 2;
    transition: all 0.3s ease;
}

.icon-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    background: linear-gradient(45deg, rgba(45, 143, 63, 0.1), rgba(244, 185, 66, 0.1));
    border-radius: 50%;
    transition: all 0.3s ease;
}

.feature-card:hover .icon-bg {
    transform: translate(-50%, -50%) scale(1.2);
    background: linear-gradient(45deg, rgba(45, 143, 63, 0.2), rgba(244, 185, 66, 0.2));
}

.feature-card h3 {
    font-size: 1.5rem;
    color: #1e293b;
    margin-bottom: 1rem;
    font-weight: 600;
}

.feature-card p {
    font-size: 1rem;
    color: #64748b;
    line-height: 1.6;
    margin: 0;
}

.feature-accent {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #2d8f3f, #f4b942, #2d8f3f);
    transform: scaleX(0);
    transition: transform 0.3s ease;
}

.feature-card:hover .feature-accent {
    transform: scaleX(1);
}

/* Stats Section */
.stats-section {
    padding: 4rem 2rem;
    background: linear-gradient(135deg, #2d8f3f 0%, #f4b942 50%, #2d8f3f 100%);
    color: white;
}

.stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    max-width: 1000px;
    margin: 0 auto;
}

.stat-item {
    text-align: center;
    padding: 1rem;
}

.stat-number {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(45deg, #fff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-label {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Footer */
.landing-footer {
    padding: 2rem;
    text-align: center;
    background: #1e293b;
    color: #94a3b8;
}

/* Responsive Design */

/* Large tablets and small desktops */
@media (max-width: 1024px) {
    .hero-content {
        max-width: 700px;
        padding: 1.5rem;
    }

    .title-line {
        font-size: 1.8rem;
    }

    .title-brand {
        font-size: 3.5rem;
    }

    .features-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }

    .feature-card {
        padding: 2rem 1.5rem;
    }

    .features-section {
        padding: 4rem 2rem;
    }
}

/* Tablets */
@media (max-width: 768px) {
    .hero-section {
        min-height: 100vh;
        padding: 1rem;
    }

    .hero-content {
        max-width: 100%;
        padding: 1rem;
    }

    .logo {
        width: 100px;
        margin-bottom: 1.5rem;
    }

    .title-line {
        font-size: 1.5rem;
        margin-bottom: 0.25rem;
    }

    .title-brand {
        font-size: 2.8rem;
        line-height: 1.1;
    }

    .hero-subtitle {
        font-size: 1.1rem;
        margin: 0 0 1.5rem 0;
        padding: 0 1rem;
    }

    .hero-badge {
        margin-bottom: 1.5rem;
        padding: 0.4rem 0.8rem;
    }

    .badge-text {
        font-size: 0.8rem;
    }

    .landing-actions {
        flex-direction: column;
        width: 100%;
        max-width: 280px;
        gap: 0.75rem;
    }

    .landing-actions .p-button {
        width: 100%;
        justify-content: center;
    }

    /* Features Section */
    .features-section {
        padding: 3rem 1.5rem;
    }

    .features-title {
        font-size: 2.2rem;
        line-height: 1.2;
    }

    .features-subtitle {
        font-size: 1rem;
        padding: 0 1rem;
    }

    .features-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        margin-top: 2.5rem;
    }

    .feature-card {
        padding: 1.8rem 1.5rem;
        margin: 0 auto;
        max-width: 400px;
    }

    .feature-icon {
        font-size: 3rem;
    }

    .feature-card h3 {
        font-size: 1.3rem;
        line-height: 1.3;
    }

    .feature-card p {
        font-size: 0.95rem;
    }

    /* Stats Section */
    .stats-section {
        padding: 3rem 1.5rem;
    }

    .stats-container {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }

    .stat-number {
        font-size: 2.2rem;
    }

    .stat-label {
        font-size: 0.9rem;
    }

    /* Floating shapes - reduce size on tablets */
    .shape-1 {
        width: 80px;
        height: 80px;
    }
    .shape-2 {
        width: 50px;
        height: 50px;
    }
    .shape-3 {
        width: 60px;
        height: 60px;
    }
    .shape-4 {
        width: 90px;
        height: 90px;
    }
}

/* Mobile phones */
@media (max-width: 480px) {
    .hero-section {
        padding: 0.5rem;
    }

    .hero-content {
        padding: 0.5rem;
    }

    .logo {
        width: 80px;
        margin-bottom: 1rem;
    }

    .logo-glow {
        width: 100px;
        height: 100px;
    }

    .title-line {
        font-size: 1.2rem;
    }

    .title-brand {
        font-size: 2.2rem;
        line-height: 1.1;
    }

    .hero-subtitle {
        font-size: 1rem;
        margin: 0 0 1.25rem 0;
        padding: 0 0.5rem;
    }

    .hero-badge {
        padding: 0.3rem 0.6rem;
        margin-bottom: 1.25rem;
    }

    .beta-badge {
        font-size: 0.7rem;
        padding: 0.2rem 0.6rem;
    }

    .badge-text {
        font-size: 0.75rem;
    }

    .landing-actions {
        max-width: 260px;
        gap: 0.6rem;
    }

    .landing-actions .p-button {
        padding: 0.7rem 1rem;
        font-size: 0.9rem;
    }

    /* Features Section */
    .features-section {
        padding: 2.5rem 1rem;
    }

    .section-header {
        margin-bottom: 2.5rem;
    }

    .features-title {
        font-size: 1.8rem;
        line-height: 1.2;
        margin-bottom: 0.75rem;
    }

    .features-subtitle {
        font-size: 0.9rem;
        line-height: 1.4;
        padding: 0 0.5rem;
    }

    .features-grid {
        gap: 1.25rem;
        margin-top: 2rem;
    }

    .feature-card {
        padding: 1.5rem 1.25rem;
        max-width: 100%;
    }

    .feature-icon-container {
        margin-bottom: 1.25rem;
    }

    .feature-icon {
        font-size: 2.5rem;
    }

    .icon-bg {
        width: 65px;
        height: 65px;
    }

    .feature-card h3 {
        font-size: 1.15rem;
        line-height: 1.3;
        margin-bottom: 0.75rem;
    }

    .feature-card p {
        font-size: 0.9rem;
        line-height: 1.5;
    }

    /* Stats Section */
    .stats-section {
        padding: 2.5rem 1rem;
    }

    .stats-container {
        grid-template-columns: 1fr;
        gap: 1.25rem;
        max-width: 280px;
        margin: 0 auto;
    }

    .stat-item {
        padding: 0.75rem;
    }

    .stat-number {
        font-size: 1.8rem;
        margin-bottom: 0.25rem;
    }

    .stat-label {
        font-size: 0.8rem;
        line-height: 1.3;
    }

    /* Footer */
    .landing-footer {
        padding: 1.5rem 1rem;
        font-size: 0.85rem;
    }

    /* Floating shapes - hide some on mobile */
    .shape-3,
    .shape-4 {
        display: none;
    }

    .shape-1 {
        width: 60px;
        height: 60px;
        top: 15%;
        left: 5%;
    }

    .shape-2 {
        width: 40px;
        height: 40px;
        top: 70%;
        right: 10%;
    }
}

/* Very small phones */
@media (max-width: 320px) {
    .title-brand {
        font-size: 1.9rem;
    }

    .features-title {
        font-size: 1.6rem;
    }

    .landing-actions {
        max-width: 240px;
    }

    .feature-card {
        padding: 1.25rem 1rem;
    }

    .stats-container {
        max-width: 240px;
    }
}

/* Landscape orientation on phones */
@media (max-height: 500px) and (orientation: landscape) {
    .hero-section {
        min-height: 100vh;
        padding: 1rem 2rem;
    }

    .hero-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: center;
        max-width: 100%;
    }

    .landing-header {
        margin-bottom: 1rem;
        text-align: left;
    }

    .landing-actions {
        align-self: center;
        max-width: none;
    }

    .logo {
        width: 60px;
        margin-bottom: 0.5rem;
    }

    .title-line {
        font-size: 1rem;
    }

    .title-brand {
        font-size: 1.8rem;
    }

    .hero-subtitle {
        font-size: 0.9rem;
        margin-bottom: 0.75rem;
    }

    .hero-badge {
        margin-bottom: 0.75rem;
    }
}
</style>
