export function extractErrorMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Error inesperado'
  );
}