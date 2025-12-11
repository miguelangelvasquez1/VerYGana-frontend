'use client';

import React, { useState } from 'react';
import { CreditCard, Download, Plus, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'charge' | 'refund' | 'topup';
  amount: number;
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

export function BillingDashboard() {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState('');

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'charge',
      amount: -45.50,
      description: 'Campaña "Producto Verano" - Impresiones',
      date: new Date('2024-11-07'),
      status: 'completed'
    },
    {
      id: '2',
      type: 'topup',
      amount: 500.00,
      description: 'Recarga de saldo',
      date: new Date('2024-11-05'),
      status: 'completed'
    },
    {
      id: '3',
      type: 'charge',
      amount: -23.75,
      description: 'Campaña "Black Friday" - Clicks',
      date: new Date('2024-11-04'),
      status: 'completed'
    },
    {
      id: '4',
      type: 'charge',
      amount: -67.80,
      description: 'Campaña "Promoción Mensual" - Impresiones',
      date: new Date('2024-11-02'),
      status: 'completed'
    }
  ];

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'charge':
        return '↗️';
      case 'refund':
        return '↩️';
      case 'topup':
        return '💰';
      default:
        return '💳';
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };

    const labels = {
      completed: 'Completado',
      pending: 'Pendiente',
      failed: 'Fallido'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Resumen de saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Actual</p>
              <p className="text-3xl font-bold text-green-600">$1,250.00</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <button
            onClick={() => setShowAddFunds(true)}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Fondos
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gastado Este Mes</p>
              <p className="text-3xl font-bold text-red-600">$347.80</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <Download className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">+15.3% vs mes anterior</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Días Restantes</p>
              <p className="text-3xl font-bold text-blue-600">~18</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Al ritmo actual de gasto</p>
        </div>
      </div>

      {/* Historial de transacciones */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Historial de Transacciones</h3>
          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Monto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-lg">{getTransactionIcon(transaction.type)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {transaction.date.toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(transaction.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de agregar fondos */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Fondos</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a agregar ($)
                </label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100.00"
                  min="10"
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setFundAmount(amount.toString())}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Tarjeta de Crédito ****1234</option>
                  <option>PayPal</option>
                  <option>Transferencia Bancaria</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddFunds(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Lógica para procesar el pago
                  setShowAddFunds(false);
                  setFundAmount('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!fundAmount || Number(fundAmount) < 10}
              >
                Agregar Fondos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}