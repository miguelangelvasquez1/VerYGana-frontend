'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { generateUniqueCodes, parseCodesFromText } from '@/utils/codeGenerator';

// ============================================================
// TIPOS
// ============================================================

export interface StockItemForm {
  code: string;
  additionalInfo: string;
  expirationDate_date: string;
  expirationDate_time: string;
}

type StockMode = 'bulk' | 'file' | 'auto';

interface SharedFields {
  additionalInfo: string;
  expirationDate_date: string;
  expirationDate_time: string;
}

interface StockInputSectionProps {
  value: StockItemForm[];
  onChange: (items: StockItemForm[]) => void;
  disabled: boolean;
}

// ============================================================
// CONSTANTES
// ============================================================

const PREVIEW_LIMIT = 5;
const MAX_QUANTITY = 9999;
const ACCEPTED_EXTENSIONS = '.csv,.txt,.xlsx';
const HEADER_KEYWORDS = ['code', 'codigo', 'código', 'clave', 'key', 'id'];

const MODE_LABELS: Record<StockMode, string> = {
  bulk: 'Pegar lista',
  file: 'Cargar archivo',
  auto: 'Generar automático',
};

const emptyShared = (): SharedFields => ({
  additionalInfo: '',
  expirationDate_date: '',
  expirationDate_time: '',
});

// ============================================================
// HELPERS
// ============================================================

const parseFileToItems = async (file: File, shared: SharedFields): Promise<StockItemForm[]> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });

  return rows.flatMap((row, idx) => {
    const cell = String(row[0] ?? '').trim();
    if (!cell) return [];
    if (idx === 0 && HEADER_KEYWORDS.some((kw) => cell.toLowerCase().includes(kw))) return [];
    return [{ code: cell, ...shared }];
  });
};

// ============================================================
// COMPONENTE
// ============================================================

export default function StockInputSection({ value, onChange, disabled }: StockInputSectionProps) {
  const [mode, setMode] = useState<StockMode>('bulk');

  // Bulk
  const [bulkText, setBulkText] = useState('');
  const [bulkCodes, setBulkCodes] = useState<string[]>([]);

  // File
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCodes, setFileCodes] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto
  const [quantity, setQuantity] = useState('');
  const [autoCodes, setAutoCodes] = useState<string[]>([]);

  // Shared
  const [sharedFields, setSharedFields] = useState<SharedFields>(emptyShared());

  // ── Cambio de modo ──────────────────────────────────────────
  const handleModeChange = (newMode: StockMode) => {
    setMode(newMode);
    setBulkCodes([]);
    setFileCodes([]);
    setAutoCodes([]);
    setSelectedFile(null);
    setFileError(null);
    onChange([]);
  };

  // ── Campos compartidos ──────────────────────────────────────
  const updateSharedField = (field: keyof SharedFields, val: string) => {
    const updated = { ...sharedFields, [field]: val };
    setSharedFields(updated);
    const activeCodes =
      mode === 'bulk' ? bulkCodes : mode === 'file' ? fileCodes : autoCodes;
    if (activeCodes.length > 0) {
      onChange(activeCodes.map((code) => ({ code, ...updated })));
    }
  };

  // ── Modo Bulk ───────────────────────────────────────────────
  const processBulk = () => {
    const codes = parseCodesFromText(bulkText);
    if (codes.length === 0) return;
    setBulkCodes(codes);
    onChange(codes.map((code) => ({ code, ...sharedFields })));
  };

  // ── Modo File ───────────────────────────────────────────────
  const processFile = async (file: File) => {
    setSelectedFile(file);
    setFileError(null);
    setFileCodes([]);
    onChange([]);

    try {
      const items = await parseFileToItems(file, sharedFields);
      if (items.length === 0) {
        setFileError('No se encontraron códigos en el archivo. Verificá que la primera columna contenga los códigos.');
        return;
      }
      setFileCodes(items.map((i) => i.code));
      onChange(items);
    } catch {
      setFileError('No se pudo leer el archivo. Verificá que sea un .csv, .txt o .xlsx válido.');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'txt', 'xlsx'].includes(ext ?? '')) {
      setFileError('Formato no soportado. Usá .csv, .txt o .xlsx');
      return;
    }
    processFile(file);
  };

  // ── Modo Auto ───────────────────────────────────────────────
  const handleGenerate = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0 || qty > MAX_QUANTITY) return;
    const codes = generateUniqueCodes(qty);
    setAutoCodes(codes);
    onChange(codes.map((code) => ({ code, ...sharedFields })));
  };

  // ── Panel de campos compartidos ─────────────────────────────
  const sharedPanel = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t mt-2">
      <div>
        <label className="block text-sm font-medium mb-1">Info adicional (todos)</label>
        <input
          value={sharedFields.additionalInfo}
          onChange={(e) => updateSharedField('additionalInfo', e.target.value)}
          className="w-full border p-2 rounded-lg"
          placeholder="Opcional"
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Fecha expiración (todos)</label>
        <input
          type="date"
          value={sharedFields.expirationDate_date}
          onChange={(e) => updateSharedField('expirationDate_date', e.target.value)}
          className="w-full border p-2 rounded-lg"
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Hora</label>
        <input
          type="time"
          value={sharedFields.expirationDate_time}
          onChange={(e) => updateSharedField('expirationDate_time', e.target.value)}
          className="w-full border p-2 rounded-lg"
          disabled={disabled}
        />
      </div>
    </div>
  );

  // ── Preview de códigos ──────────────────────────────────────
  const activeCodes =
    mode === 'bulk' ? bulkCodes : mode === 'file' ? fileCodes : autoCodes;

  const codePreview = activeCodes.length > 0 && (
    <div className="mt-3">
      <p className="text-sm font-medium text-green-700 mb-2">
        ✓ {activeCodes.length} código{activeCodes.length !== 1 ? 's' : ''} listos para enviar
      </p>
      <div className="max-h-36 overflow-y-auto border rounded-lg bg-white p-2">
        {activeCodes.slice(0, PREVIEW_LIMIT).map((code, i) => (
          <p key={i} className="text-sm font-mono text-gray-700 py-0.5 border-b last:border-0">
            {code}
          </p>
        ))}
        {activeCodes.length > PREVIEW_LIMIT && (
          <p className="text-xs text-gray-400 pt-1 pb-0.5">
            ...y {activeCodes.length - PREVIEW_LIMIT} código
            {activeCodes.length - PREVIEW_LIMIT !== 1 ? 's' : ''} más
          </p>
        )}
      </div>
    </div>
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-4">
      {/* Header con selector de modo */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Códigos de stock</h3>
          {value.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {value.length} configurados
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MODE_LABELS) as StockMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              disabled={disabled}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Modo: Pegar lista ── */}
      {mode === 'bulk' && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
          <p className="text-sm text-gray-600">
            Pega tus códigos separados por salto de línea, coma o punto y coma.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full border p-2 rounded-lg font-mono text-sm resize-none"
            rows={8}
            placeholder={'CODE001\nCODE002\nCODE003'}
            disabled={disabled}
          />
          {sharedPanel}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={processBulk}
              disabled={disabled || !bulkText.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Procesar códigos
            </button>
            {bulkText.trim() && (
              <span className="text-sm text-gray-500">
                {parseCodesFromText(bulkText).length} detectados
              </span>
            )}
          </div>
          {codePreview}
        </div>
      )}

      {/* ── Modo: Cargar archivo ── */}
      {mode === 'file' && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
          <p className="text-sm text-gray-600">
            Sube un archivo con tus códigos. La primera columna de cada fila se usará como código.
            Formatos soportados: <span className="font-medium">.csv, .txt, .xlsx</span>
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition py-10 ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Haz clic para cambiar el archivo
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Arrastra tu archivo aquí o{' '}
                  <span className="text-blue-600 font-medium">haz clic para seleccionar</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">.csv · .txt · .xlsx</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={handleFileInput}
            disabled={disabled}
          />

          {fileError && (
            <p className="text-sm text-red-600">{fileError}</p>
          )}

          {sharedPanel}
          {codePreview}
        </div>
      )}

      {/* ── Modo: Generar automático ── */}
      {mode === 'auto' && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
          <p className="text-sm text-gray-600">
            ¿No tienes códigos para tus productos?, no te preocupes. Nosotros lo hacemos por ti. Ingresa la cantidad de unidades y se generarán códigos únicos que el comprador presentará
            al retirar su producto físico.
          </p>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad de unidades *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="border p-2 rounded-lg w-36"
                min="1"
                max={MAX_QUANTITY}
                placeholder="ej: 100"
                disabled={disabled}
              />
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={
                disabled ||
                !quantity ||
                parseInt(quantity) <= 0 ||
                parseInt(quantity) > MAX_QUANTITY
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Generar códigos
            </button>
          </div>
          {sharedPanel}
          {codePreview}
        </div>
      )}
    </div>
  );
}
