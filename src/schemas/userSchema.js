// src/schemas/userSchema.js
import * as yup from 'yup';

export const userSchema = yup.object({
    name: yup.string().required('El nombre es requerido').min(3, 'Mínimo 3 caracteres'),
    dni: yup
        .string()
        .required('El DNI es requerido')
        .matches(/^[0-9]{8,10}$/, 'DNI debe contener 8-10 dígitos'),
    email: yup.string().required('El email es requerido').email('Email inválido'),
    phone: yup
        .string()
        .required('El teléfono es requerido')
        .matches(/^[0-9]{10,15}$/, 'Teléfono debe contener 10-15 dígitos'),
    position: yup.string().required('El cargo es requerido'),
    is_active: yup.boolean().default(true)
});
