// components/admin/SystemManagement.tsx
'use client';

import React, { useState } from 'react';
import { SystemModule } from '../../types/SystemModule';
import { Shield, ToggleLeft, ToggleRight, Settings, AlertTriangle } from 'lucide-react';

const SystemManagement: React.FC = () => {
  const [modules, setModules] = useState<SystemModule[]>([
    {
      id: '1',
      name: 'Sistema de Rifas',
      description: 'Permite crear y gestionar rifas en el sistema',
      isActive: true,
      path: '/raffles'
    },
    {
      id: '2',
      name: 'Registro de Usuarios',
      description: 'Permite que nuevos usuarios se registren',
      isActive: true,
      path: '/register'
    },
    {
      id: '3',
      name: 'Pagos Online',
      description: 'Sistema de procesamiento de pagos',
      isActive: true,
      path: '/payments'
    },
    {
      id: '4',
      name: 'Notificaciones Email',
      description: 'Envío automático de notificaciones por email',
      isActive: false,
      path: '/notifications'
    },
    {
      id: '5',
      name: 'Chat de Soporte',
      description: 'Sistema de chat en vivo para atención al cliente',
      isActive: true,
      path: '/support'
    },
    {
      id: '6',
      name: 'Análisis y Reportes',
      description: 'Generación de reportes y análisis estadísticos',
      isActive: true,
      path: '/analytics'
    }
  ]);

  const toggleModule = (moduleId: string) => {
    setModules(modules.map(module =>
      module.id === moduleId
        ? { ...module, isActive: !module.isActive }
        : module
    ));
  };

  const activeModules = modules.filter(m => m.isActive).length;
  const totalModules = modules.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Gestión del Sistema</h2>
        <div className="flex space-x-2">
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
            <AlertTriangle size={20} />
            <span>Modo Mantenimiento</span>
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
            <Settings size={20} />
            <span>Configuración Avanzada</span>
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estado del Sistema</p>
              <p className="text-2xl font-semibold text-green-600">Operativo</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Módulos Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{activeModules}/{totalModules}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded">
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tiempo de Actividad</p>
              <p className="text-2xl font-semibold text-gray-900">99.9%</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Modules */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Módulos del Sistema</h3>
          <p className="text-sm text-gray-600">Activa o desactiva módulos completos del sistema</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${module.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{module.name}</h4>
                      <p className="text-sm text-gray-600">{module.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Ruta: {module.path}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    module.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {module.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  
                  <button
                    onClick={() => toggleModule(module.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      module.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {module.isActive ? (
                      <ToggleRight size={24} className="text-green-600" />
                    ) : (
                      <ToggleLeft size={24} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Acciones del Sistema</h3>
          <p className="text-sm text-gray-600">Acciones críticas que afectan todo el sistema</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 text-left">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Modo Mantenimiento</h4>
                  <p className="text-sm text-gray-600">Poner el sistema en mantenimiento</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left">
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Reiniciar Servicios</h4>
                  <p className="text-sm text-gray-600">Reiniciar todos los servicios del sistema</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 text-left">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Backup Completo</h4>
                  <p className="text-sm text-gray-600">Crear respaldo de toda la información</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border-2 border-dashed border-red-300 rounded-lg hover:border-red-400 hover:bg-red-50 text-left">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <h4 className="font-medium text-gray-900">Limpiar Cache</h4>
                  <p className="text-sm text-gray-600">Limpiar toda la caché del sistema</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemManagement;