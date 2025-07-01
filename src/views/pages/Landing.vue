<template>
    <div class="landing-page">
        <div class="landing-header">
            <img src="/images/almazenlogo.png" alt="Almazen" class="logo" />
            <h1>Bienvenido a Almazen</h1>
            <p>Sistema de Gestión de Inventarios y Compras</p>
        </div>
        
        <div class="landing-actions">
            <Button 
                label="Iniciar Sesión" 
                @click="$router.push('/login')"
                icon="pi pi-sign-in"
                size="large"
            />
            <Button 
                label="Registrarse" 
                @click="$router.push('/register')"
                icon="pi pi-user-plus"
                severity="secondary"
                outlined
                size="large"
            />
        </div>
    </div>
</template>

<style scoped>
.landing-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-ground) 100%);
}

.landing-header {
    text-align: center;
    margin-bottom: 3rem;
}

.logo {
    width: 120px;
    height: auto;
    margin-bottom: 2rem;
}

h1 {
    font-size: 3rem;
    color: var(--primary-color);
    margin: 0 0 1rem 0;
    font-weight: 600;
}

p {
    font-size: 1.25rem;
    color: var(--text-color-secondary);
    margin: 0;
}

.landing-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
}

@media (max-width: 768px) {
    h1 {
        font-size: 2rem;
    }
    
    .landing-actions {
        flex-direction: column;
        width: 100%;
        max-width: 300px;
    }
}
</style>