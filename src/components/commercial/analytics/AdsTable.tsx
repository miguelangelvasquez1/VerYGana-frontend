interface AdsTableProps {
  dateRange?: string;
}

export default function AdsTable({ dateRange }: AdsTableProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Anuncio</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Anuncio</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Impresiones</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Clicks</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">CTR</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Gasto</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">Promoción Black Friday</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Activo</span>
                </td>
                <td className="py-3 px-4">15,430</td>
                <td className="py-3 px-4">847</td>
                <td className="py-3 px-4">5.49%</td>
                <td className="py-3 px-4">$245.80</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">Producto Verano</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pausado</span>
                </td>
                <td className="py-3 px-4">8,920</td>
                <td className="py-3 px-4">267</td>
                <td className="py-3 px-4">2.99%</td>
                <td className="py-3 px-4">$123.45</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
}