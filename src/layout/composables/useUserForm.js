import { ref } from 'vue';

export function useUserForm(initialData = {}) {
    const form = ref({
        id: null,
        name: '',
        dni: '',
        email: '',
        phone: '',
        position: '',
        is_active: true,
        ...initialData
    });

    const resetForm = () => {
        form.value = {
            id: null,
            name: '',
            dni: '',
            email: '',
            phone: '',
            position: '',
            is_active: true
        };
    };

    return { form, resetForm };
}
