export function handleError(error, fallbackMessage = 'Ocurrió un error') {
    // Redirección si no autorizado
    if (error?.status_code === 401) {
        window.location.href = '/login';
        return 'Sesión expirada. Redirigiendo al login...';
    }
    const response = error?.data;

    // Extraer errores de validación
    if (response?.errors && typeof response.errors === 'object') {
        const messages = [];

        for (const field in response.errors) {
            if (Array.isArray(response.errors[field])) {
                messages.push(...response.errors[field]);
            } else if (typeof response.errors[field] === 'string') {
                messages.push(response.errors[field]);
            }
        }

        if (messages.length > 0) {
            return messages.join('\n'); // O usa '. ' si prefieres una sola línea
        }
    }

    // Mostrar mensaje general si existe
    if (response?.message) {
        return response.message;
    }

    // Mostrar mensaje del error como fallback
    if (error?.message) {
        return error.message;
    }

    // Fallback final
    return fallbackMessage;
}
