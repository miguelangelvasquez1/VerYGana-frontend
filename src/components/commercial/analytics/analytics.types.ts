// Rango de fechas usado por los filtros del panel de analíticas.
// Los componentes de cada sección lo reciben ya resuelto (yyyy-mm-dd) para
// que cada uno arme la consulta a su respectivo endpoint.
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}
