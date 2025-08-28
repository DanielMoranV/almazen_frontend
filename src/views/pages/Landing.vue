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
                    icon: 'pi-file-edit',
                    title: 'Sistema de Cotizaciones Profesional',
                    description: 'Crea cotizaciones personalizadas, gestiona aprobaciones y convierte automáticamente a ventas pagadas.'
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
            ],
            userGuide: [
                {
                    title: 'Sistema de Roles',
                    icon: 'pi-users',
                    description: 'Estructura optimizada con 4 roles específicos',
                    items: [
                        { name: 'Administrador', description: 'Control total: usuarios, configuración empresarial, sistema de cajas y funcionalidades administrativas' },
                        { name: 'Vendedor', description: 'POS completo, ventas, créditos, movimientos de caja y consulta de inventario' },
                        { name: 'Logística', description: 'Gestión integral de inventario: productos, stock, compras, proveedores y almacenes' },
                        { name: 'Auxiliar', description: 'Apoyo operativo: POS básico, consulta de stock y gestión de clientes' }
                    ]
                },
                {
                    title: 'Punto de Venta Avanzado',
                    icon: 'pi-desktop',
                    description: 'Sistema POS completo para ventas rápidas y eficientes',
                    items: [
                        { name: 'Búsqueda Inteligente', description: 'Encuentra productos por nombre, SKU o código de barras de forma instantánea' },
                        { name: 'Carrito Dinámico', description: 'Gestión de productos con selección de lotes, fechas de vencimiento y almacenes' },
                        { name: 'Múltiples Métodos de Pago', description: 'Procesa pagos en efectivo, tarjeta, transferencias y combinaciones' },
                        { name: 'Gestión de Clientes', description: 'Crea y gestiona clientes durante la venta con historial de compras' }
                    ]
                },
                {
                    title: 'Control de Inventario',
                    icon: 'pi-box',
                    description: 'Gestión completa de productos y stock multi-almacén',
                    items: [
                        { name: 'Importación Masiva', description: 'Carga productos e inventario desde Excel con templates predefinidos' },
                        { name: 'Multi-Almacén', description: 'Gestiona stock en múltiples ubicaciones con transferencias automáticas' },
                        { name: 'Control de Lotes', description: 'Trazabilidad completa con fechas de vencimiento y alertas automáticas' },
                        { name: 'Ajustes y Auditoría', description: 'Correcciones de inventario con justificaciones y reportes de diferencias' }
                    ]
                },
                {
                    title: 'Sistema de Caja Inteligente',
                    icon: 'pi-wallet',
                    description: 'Control completo de sesiones y movimientos de efectivo',
                    items: [
                        { name: 'Sesiones de Caja', description: 'Apertura y cierre de turnos con control de efectivo inicial y final' },
                        { name: 'Movimientos Automáticos', description: 'Registro automático de ingresos, egresos y depósitos por venta' },
                        { name: 'Múltiples Cajas', description: 'Soporte para varias cajas registradoras con configuración independiente' },
                        { name: 'Reportes Detallados', description: 'Análisis completo de sesiones con diferencias y totales por método de pago' }
                    ]
                },
                {
                    title: 'Gestión de Créditos',
                    icon: 'pi-credit-card',
                    description: 'Sistema avanzado para control de ventas a crédito',
                    items: [
                        { name: 'Dashboard Especializado', description: 'Métricas en tiempo real de créditos pendientes, vencidos y cobrados' },
                        { name: 'Límites Personalizados', description: 'Control de límites de crédito por cliente con alertas de exceso' },
                        { name: 'Alertas de Vencimiento', description: 'Notificaciones automáticas de créditos próximos a vencer' },
                        { name: 'Análisis de Cobranza', description: 'Reportes de antigüedad de saldos y estrategias de recuperación' }
                    ]
                },
                {
                    title: 'Sistema de Cotizaciones Profesional',
                    icon: 'pi-file-edit',
                    description: 'Plataforma completa para crear, gestionar y convertir cotizaciones comerciales',
                    items: [
                        { name: 'Creación de Cotizaciones', description: 'Diseña cotizaciones personalizadas con productos, precios y condiciones específicas para cada cliente' },
                        { name: 'Gestión de Estados', description: 'Control de flujo completo: Pendiente, Aprobado, Rechazado y Vencido con fechas de validez automáticas' },
                        { name: 'Aprobación y Conversión', description: 'Proceso de aprobación que convierte automáticamente cotizaciones en ventas con registro de pago' },
                        { name: 'Exportación Profesional', description: 'Descarga cotizaciones en PDF y Excel con formato empresarial y logos personalizados' }
                    ]
                },
                {
                    title: 'Análisis y Reportes',
                    icon: 'pi-chart-line',
                    description: 'Business Intelligence integrado para toma de decisiones',
                    items: [
                        { name: 'Dashboard en Tiempo Real', description: 'Métricas de ventas, inventario y alertas actualizadas automáticamente' },
                        { name: 'Exportación Excel', description: 'Genera reportes detallados de ventas, inventario y finanzas' },
                        { name: 'Análisis de Rotación', description: 'Identifica productos de alta y baja rotación para optimizar compras' },
                        { name: 'Alertas Inteligentes', description: 'Notificaciones de stock bajo, productos por vencer y anomalías' }
                    ]
                }
            ],
            workflows: [
                {
                    title: 'Proceso de Venta Rápida',
                    steps: [
                        'Abrir sesión de caja con efectivo inicial',
                        'Buscar productos por código de barras o nombre',
                        'Agregar al carrito seleccionando lotes si aplica',
                        'Seleccionar cliente o crear uno nuevo',
                        'Procesar pago con uno o múltiples métodos',
                        'Generar comprobante automáticamente'
                    ]
                },
                {
                    title: 'Flujo de Cotizaciones Comerciales',
                    steps: [
                        'Crear nueva cotización con datos del cliente',
                        'Agregar productos con precios personalizados',
                        'Establecer fecha de validez y condiciones',
                        'Generar y exportar cotización en PDF/Excel',
                        'Cliente revisa y acepta la propuesta',
                        'Aprobar cotización y convertir a venta pagada'
                    ]
                },
                {
                    title: 'Gestión de Inventario',
                    steps: [
                        'Importar productos masivamente desde Excel',
                        'Configurar stock inicial por almacén',
                        'Gestionar lotes y fechas de vencimiento',
                        'Realizar ajustes cuando sea necesario',
                        'Transferir productos entre almacenes',
                        'Monitorear alertas automáticas de stock'
                    ]
                },
                {
                    title: 'Control Financiero',
                    steps: [
                        'Revisar dashboard con métricas diarias',
                        'Analizar créditos pendientes y vencidos',
                        'Generar reportes de ventas por período',
                        'Verificar sesiones de caja y diferencias',
                        'Exportar datos para análisis contable',
                        'Configurar alertas de límites de crédito'
                    ]
                }
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

        <!-- User Guide Section -->
        <div class="guide-section">
            <div class="section-header">
                <h2 class="guide-title">Guía del Usuario</h2>
                <p class="guide-subtitle">Descubre las funcionalidades principales y cómo aprovechar al máximo Almazen</p>
            </div>

            <div class="guide-content">
                <div class="guide-item" v-for="(item, index) in userGuide" :key="index">
                    <div class="guide-header-section">
                        <div class="guide-icon-container">
                            <i :class="`pi ${item.icon} guide-icon`"></i>
                        </div>
                        <div class="guide-text">
                            <h3 class="guide-item-title">{{ item.title }}</h3>
                            <p class="guide-item-description">{{ item.description }}</p>
                        </div>
                    </div>
                    <div class="guide-details">
                        <div class="guide-detail-item" v-for="(detail, dIndex) in item.items" :key="dIndex">
                            <div class="detail-marker"></div>
                            <div class="detail-content">
                                <h4 class="detail-name">{{ detail.name }}</h4>
                                <p class="detail-description">{{ detail.description }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Workflows Section -->
        <div class="workflows-section">
            <div class="section-header">
                <h2 class="workflows-title">Flujos de Trabajo</h2>
                <p class="workflows-subtitle">Procesos optimizados para operaciones diarias eficientes</p>
            </div>
            
            <div class="workflows-grid">
                <div class="workflow-card" v-for="(workflow, index) in workflows" :key="index">
                    <h3 class="workflow-title">{{ workflow.title }}</h3>
                    <div class="workflow-steps">
                        <div class="workflow-step" v-for="(step, sIndex) in workflow.steps" :key="sIndex">
                            <div class="step-number">{{ sIndex + 1 }}</div>
                            <p class="step-text">{{ step }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- CTA Section -->
        <div class="cta-section">
            <div class="cta-content">
                <h2 class="cta-title">¿Listo para optimizar tu negocio?</h2>
                <p class="cta-subtitle">Únete a empresas que ya confían en Almazen para gestionar su inventario y ventas</p>
                <div class="cta-actions">
                    <Button label="Comenzar Ahora" @click="$router.push('/login')" icon="pi pi-arrow-right" size="large" class="cta-primary-button" />
                </div>
                <div class="demo-credentials">
                    <p class="demo-title">🧪 Cuenta de Prueba</p>
                    <div class="demo-info">
                        <div class="credential-item">
                            <span class="credential-label">DNI:</span>
                            <span class="credential-value">12345678</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Contraseña:</span>
                            <span class="credential-value">admin123</span>
                        </div>
                    </div>
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

/* Guide Section */
.guide-section {
    padding: 5rem 2rem;
    background: #f8fafc;
}

.guide-title {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(45deg, #2d8f3f, #f4b942, #2d8f3f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
    text-align: center;
}

.guide-subtitle {
    font-size: 1.2rem;
    color: #64748b;
    margin: 0 auto 4rem auto;
    text-align: center;
    max-width: 600px;
}

.guide-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    gap: 3rem;
}

.guide-item {
    background: white;
    border-radius: 20px;
    padding: 2.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(45, 143, 63, 0.1);
    transition: all 0.3s ease;
}

.guide-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 60px rgba(45, 143, 63, 0.1);
}

.guide-header-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #f1f5f9;
}

.guide-icon-container {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(45deg, rgba(45, 143, 63, 0.1), rgba(244, 185, 66, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.guide-icon {
    font-size: 2.5rem;
    background: linear-gradient(45deg, #2d8f3f, #f4b942);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.guide-text {
    flex: 1;
}

.guide-item-title {
    font-size: 1.8rem;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
    font-weight: 700;
}

.guide-item-description {
    font-size: 1.1rem;
    color: #64748b;
    margin: 0;
    line-height: 1.6;
}

.guide-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}

.guide-detail-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border-radius: 12px;
    background: #f8fafc;
    transition: all 0.3s ease;
}

.guide-detail-item:hover {
    background: linear-gradient(45deg, rgba(45, 143, 63, 0.05), rgba(244, 185, 66, 0.05));
    transform: translateX(5px);
}

.detail-marker {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(45deg, #2d8f3f, #f4b942);
    flex-shrink: 0;
    margin-top: 6px;
}

.detail-content {
    flex: 1;
}

.detail-name {
    font-size: 1.1rem;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
}

.detail-description {
    font-size: 0.95rem;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
}

/* Workflows Section */
.workflows-section {
    padding: 5rem 2rem;
    background: white;
}

.workflows-title {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(45deg, #2d8f3f, #f4b942, #2d8f3f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
    text-align: center;
}

.workflows-subtitle {
    font-size: 1.2rem;
    color: #64748b;
    margin: 0 auto 4rem auto;
    text-align: center;
    max-width: 600px;
}

.workflows-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.workflow-card {
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-radius: 20px;
    padding: 2rem;
    border: 2px solid #f1f5f9;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.workflow-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #2d8f3f, #f4b942, #2d8f3f);
}

.workflow-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(45, 143, 63, 0.1);
    border-color: rgba(244, 185, 66, 0.3);
}

.workflow-title {
    font-size: 1.5rem;
    color: #1e293b;
    margin: 0 0 2rem 0;
    font-weight: 700;
    text-align: center;
}

.workflow-steps {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.workflow-step {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
}

.workflow-step:hover {
    background: linear-gradient(45deg, rgba(45, 143, 63, 0.02), rgba(244, 185, 66, 0.02));
    border-color: rgba(45, 143, 63, 0.2);
}

.step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(45deg, #2d8f3f, #f4b942);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
}

.step-text {
    margin: 0;
    color: #475569;
    line-height: 1.5;
    font-size: 0.95rem;
}

/* CTA Section */
.cta-section {
    padding: 5rem 2rem;
    background: linear-gradient(135deg, #2d8f3f 0%, #f4b942 50%, #2d8f3f 100%);
    color: white;
    text-align: center;
}

.cta-content {
    max-width: 800px;
    margin: 0 auto;
}

.cta-title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    background: linear-gradient(45deg, #fff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.cta-subtitle {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 3rem 0;
    line-height: 1.6;
}

.cta-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 3rem;
}

.cta-primary-button {
    background: linear-gradient(45deg, #1e5f2a, #0f3d17) !important;
    border: none !important;
    transform: scale(1);
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.cta-primary-button:hover {
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}


.demo-credentials {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 2rem;
    max-width: 400px;
    margin: 0 auto;
}

.demo-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    text-align: center;
    color: rgba(255, 255, 255, 0.95);
}

.demo-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.credential-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}

.credential-item:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
}

.credential-label {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
}

.credential-value {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-weight: 600;
    color: #ffffff;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.9rem;
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

    /* Guide Section */
    .guide-section {
        padding: 4rem 2rem;
    }

    .guide-title {
        font-size: 2.5rem;
    }

    .guide-item-title {
        font-size: 1.6rem;
    }

    .guide-details {
        grid-template-columns: 1fr;
    }

    /* Workflows Section */
    .workflows-section {
        padding: 4rem 2rem;
    }

    .workflows-title {
        font-size: 2.5rem;
    }

    .workflows-grid {
        grid-template-columns: 1fr;
    }

    /* CTA Section */
    .cta-section {
        padding: 4rem 2rem;
    }

    .cta-title {
        font-size: 2.5rem;
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

    /* Guide Section */
    .guide-section {
        padding: 3rem 1.5rem;
    }

    .guide-title {
        font-size: 2.2rem;
    }

    .guide-item {
        padding: 2rem 1.5rem;
    }

    .guide-header-section {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }

    .guide-icon-container {
        width: 60px;
        height: 60px;
    }

    .guide-icon {
        font-size: 2rem;
    }

    .guide-item-title {
        font-size: 1.4rem;
    }

    .guide-details {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .guide-detail-item {
        padding: 0.8rem;
    }

    /* Workflows Section */
    .workflows-section {
        padding: 3rem 1.5rem;
    }

    .workflows-title {
        font-size: 2.2rem;
    }

    .workflow-card {
        padding: 1.5rem;
    }

    .workflow-title {
        font-size: 1.3rem;
    }

    /* CTA Section */
    .cta-section {
        padding: 3rem 1.5rem;
    }

    .cta-title {
        font-size: 2.2rem;
    }

    .cta-actions {
        margin-bottom: 2rem;
    }

    .demo-credentials {
        padding: 1.5rem;
        max-width: 350px;
    }

    .demo-title {
        font-size: 1.1rem;
    }

    .credential-item {
        padding: 0.6rem 0.8rem;
    }

    .credential-label,
    .credential-value {
        font-size: 0.85rem;
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

    /* Guide Section */
    .guide-section {
        padding: 2.5rem 1rem;
    }

    .guide-title {
        font-size: 1.8rem;
    }

    .guide-subtitle {
        font-size: 1rem;
        padding: 0 0.5rem;
    }

    .guide-item {
        padding: 1.5rem 1.25rem;
    }

    .guide-item-title {
        font-size: 1.15rem;
    }

    .guide-item-description {
        font-size: 0.95rem;
    }

    .detail-name {
        font-size: 1rem;
    }

    .detail-description {
        font-size: 0.9rem;
    }

    /* Workflows Section */
    .workflows-section {
        padding: 2.5rem 1rem;
    }

    .workflows-title {
        font-size: 1.8rem;
    }

    .workflows-subtitle {
        font-size: 1rem;
        padding: 0 0.5rem;
    }

    .workflow-card {
        padding: 1.25rem 1rem;
    }

    .workflow-title {
        font-size: 1.15rem;
    }

    .workflow-step {
        padding: 0.8rem;
    }

    .step-number {
        width: 28px;
        height: 28px;
        font-size: 0.8rem;
    }

    .step-text {
        font-size: 0.9rem;
    }

    /* CTA Section */
    .cta-section {
        padding: 2.5rem 1rem;
    }

    .cta-title {
        font-size: 1.8rem;
        line-height: 1.2;
    }

    .cta-subtitle {
        font-size: 1rem;
        padding: 0 0.5rem;
    }

    .demo-credentials {
        padding: 1.25rem 1rem;
        max-width: 300px;
    }

    .demo-title {
        font-size: 1rem;
        margin-bottom: 1rem;
    }

    .credential-item {
        padding: 0.5rem 0.6rem;
        flex-direction: column;
        gap: 0.25rem;
        text-align: center;
    }

    .credential-label,
    .credential-value {
        font-size: 0.8rem;
    }

    .credential-value {
        padding: 0.2rem 0.4rem;
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
