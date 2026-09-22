/* ============================================================
   UTILITY: MENSAJES DE ERROR AMIGABLES
   ============================================================ */

export const getFriendlyErrorMessage = (error: any): string => {
    // Si es un error de validación del backend
    if (error?.response?.data?.message) {
        const message = error.response.data.message;

        // Mapeo de errores conocidos a mensajes amigables en español
        const errorMap: Record<string, string> = {
            'Cannot draw raffle before draw date':
                'No se puede realizar el sorteo antes de la fecha programada. Por favor, actualiza la fecha del sorteo en la sección de edición.',

            'Raffle is not active':
                'La rifa no está activa. Solo se pueden realizar sorteos en rifas activas.',

            'Raffle has already been drawn':
                'Esta rifa ya ha sido sorteada. No se puede repetir el proceso.',

            'Not enough participants':
                'No hay suficientes participantes para realizar el sorteo. Se necesitan al menos 2 participantes.',

            'Invalid draw date':
                'La fecha del sorteo no es válida. Verifica que la fecha sea correcta y esté en el futuro.',

            'Max tickets exceeded':
                'Se ha superado el límite máximo de tickets para esta rifa.',

            'User not eligible':
                'El usuario no cumple con los requisitos para participar en esta rifa.',

            'Duplicate entry':
                'Ya existe un registro con esta información. Por favor, verifica los datos.',

            'Raffle not found':
                'La rifa no existe o fue eliminada. Por favor, recarga la página.',

            'Raffle is already active':
                'La rifa ya se encuentra activa. No es necesario activarla nuevamente.',

            'Raffle has been cancelled':
                'La rifa está cancelada. No se puede realizar esta acción.',

            'Draw date must be after start date':
                'La fecha del sorteo debe ser posterior a la fecha de inicio de la rifa.',

            'End date must be before draw date':
                'La fecha de cierre debe ser anterior a la fecha del sorteo.',

            'Start date cannot be in the past':
                'La fecha de inicio no puede ser en el pasado.',

            'Invalid status transition':
                'No es posible cambiar la rifa a este estado. Verifica el estado actual.',

            'Network Error':
                'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
        };

        // Buscar coincidencia exacta o parcial
        for (const [key, value] of Object.entries(errorMap)) {
            if (message.includes(key)) {
                return value;
            }
        }

        // Si hay un array de errores (validaciones múltiples)
        if (Array.isArray(message)) {
            return message.join('. ');
        }

        // Si no hay coincidencia, devolver un mensaje genérico pero amigable
        return `Error al procesar la solicitud. Por favor, intenta nuevamente.`;
    }

    // Errores de validación de campos específicos
    if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
            return firstError[0] || 'Error de validación. Verifica los datos ingresados.';
        }
        return String(firstError) || 'Error de validación. Verifica los datos ingresados.';
    }

    // Errores de red o conexión
    if (error?.message?.includes('Network Error') || error?.message?.includes('network')) {
        return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
    }

    // Si el error ya es un string
    if (typeof error === 'string') {
        return error;
    }

    // Error genérico
    return 'Ocurrió un error inesperado. Por favor, intenta nuevamente más tarde.';
};
