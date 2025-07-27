<template>
    <div class="notfound-page">
        <div class="notfound-content">
            <i class="pi pi-exclamation-triangle notfound-icon"></i>
            <h1>404</h1>
            <h2>Página No Encontrada</h2>
            <p>La página que busca no existe o ha sido movida.</p>
            <Button label="Ir al Dashboard" @click="$router.push('/dashboard')" icon="pi pi-home" />
        </div>
    </div>
</template>

<style scoped>
.notfound-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    background: var(--surface-ground);
}

.notfound-content {
    text-align: center;
    max-width: 500px;
}

.notfound-icon {
    font-size: 5rem;
    color: var(--red-500);
    margin-bottom: 1rem;
}

h1 {
    font-size: 6rem;
    font-weight: bold;
    color: var(--red-500);
    margin: 0;
    line-height: 1;
}

h2 {
    color: var(--text-color);
    margin: 1rem 0;
    font-size: 2rem;
}

p {
    color: var(--text-color-secondary);
    margin-bottom: 2rem;
    font-size: 1.1rem;
}
</style>
