<template>
    <div class="empty-page">
        <div class="empty-content">
            <i class="pi pi-exclamation-circle empty-icon"></i>
            <h2>Funcionalidad en Desarrollo</h2>
            <p>Esta funcionalidad estará disponible en futuras actualizaciones.</p>
            <Button 
                label="Volver al Dashboard" 
                @click="$router.push('/dashboard')"
                icon="pi pi-home"
            />
        </div>
    </div>
</template>

<style scoped>
.empty-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 2rem;
}

.empty-content {
    text-align: center;
    max-width: 400px;
}

.empty-icon {
    font-size: 4rem;
    color: var(--text-color-secondary);
    margin-bottom: 1rem;
}

h2 {
    color: var(--text-color);
    margin-bottom: 1rem;
}

p {
    color: var(--text-color-secondary);
    margin-bottom: 2rem;
}
</style>