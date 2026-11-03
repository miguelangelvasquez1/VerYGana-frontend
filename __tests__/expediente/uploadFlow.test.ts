import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import {
  createExpedienteUploadSchema,
  ExpedienteUploadError,
  runExpedienteUpload,
  shouldRefetchExpedienteAfterError,
  uploadErrorMessage,
  validateExpedienteFile,
} from '@/lib/expediente/uploadFlow';

const TOO_LARGE = 'El archivo supera el tamaño máximo de 10MB';
const BAD_FORMAT = 'Formato no permitido. Usa PDF, JPG o PNG';
const GENERIC = 'No pudimos subir el documento. Intenta de nuevo';
const SIGNED_URL = 'https://r2.example.test/firmada?X-Amz-Signature=abc';
const MIB = 1024 * 1024;

function fileOf(size: number, type: string, name = 'a.pdf'): File {
  // Un File con el tamaño pedido sin reservar memoria de más en el cuerpo.
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function axiosError(status: number, message?: string): AxiosError {
  return new AxiosError('fallo', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: message ? { message } : {},
  } as AxiosResponse);
}

function makeDeps() {
  return {
    prepare: vi.fn().mockResolvedValue({
      documentId: 9,
      permission: { uploadUrl: SIGNED_URL, expiresInSeconds: 60 },
    }),
    put: vi.fn().mockResolvedValue(undefined),
    confirm: vi.fn().mockResolvedValue({ id: 9 }),
  };
}

describe('validateExpedienteFile', () => {
  it('PDF, JPEG y PNG de 1 KB pasan; 10 MiB exactos pasan', () => {
    expect(validateExpedienteFile(fileOf(1024, 'application/pdf'))).toBeNull();
    expect(validateExpedienteFile(fileOf(1024, 'image/jpeg'))).toBeNull();
    expect(validateExpedienteFile(fileOf(1024, 'image/png'))).toBeNull();
    expect(validateExpedienteFile(fileOf(10 * MIB, 'application/pdf'))).toBeNull();
  });

  it('RN-3: tamaño y formato', () => {
    expect(validateExpedienteFile(fileOf(10 * MIB + 1, 'application/pdf'))).toBe(TOO_LARGE);
    expect(validateExpedienteFile(fileOf(10, 'text/plain'))).toBe(BAD_FORMAT);
  });

  it('el tamaño se comprueba antes que el formato', () => {
    expect(validateExpedienteFile(fileOf(11 * MIB, 'text/plain'))).toBe(TOO_LARGE);
  });
});

describe('runExpedienteUpload', () => {
  it('CA-4: con un archivo inválido rechaza en "validate" y no llama a prepare', async () => {
    const deps = makeDeps();
    const error = await runExpedienteUpload(
      { file: fileOf(10, 'text/plain'), documentType: 'RUT' },
      deps,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ExpedienteUploadError);
    expect((error as ExpedienteUploadError).stage).toBe('validate');
    expect(deps.prepare).not.toHaveBeenCalled();
    expect(deps.put).not.toHaveBeenCalled();
  });

  it('prepara, sube y confirma en orden con el cuerpo esperado', async () => {
    const deps = makeDeps();
    const file = fileOf(2048, 'application/pdf', 'rut.pdf');
    const result = await runExpedienteUpload({ file, documentType: 'RUT' }, deps);
    expect(deps.prepare).toHaveBeenCalledWith({
      documentType: 'RUT',
      originalFileName: 'rut.pdf',
      contentType: 'application/pdf',
      sizeBytes: 2048,
    });
    expect(deps.put).toHaveBeenCalledWith(SIGNED_URL, file);
    expect(deps.confirm).toHaveBeenCalledWith(9);
    expect(result).toEqual({ id: 9 });
    const order = [
      deps.prepare.mock.invocationCallOrder[0],
      deps.put.mock.invocationCallOrder[0],
      deps.confirm.mock.invocationCallOrder[0],
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('CA-2 y CA-3: replacesDocumentId solo viaja cuando hay uno', async () => {
    const withReplace = makeDeps();
    await runExpedienteUpload(
      { file: fileOf(10, 'image/png'), documentType: 'RUT', replacesDocumentId: 5 },
      withReplace,
    );
    expect(withReplace.prepare.mock.calls[0][0]).toHaveProperty('replacesDocumentId', 5);

    for (const replaces of [null, undefined]) {
      const deps = makeDeps();
      await runExpedienteUpload(
        { file: fileOf(10, 'image/png'), documentType: 'RUT', replacesDocumentId: replaces },
        deps,
      );
      expect(deps.prepare.mock.calls[0][0]).not.toHaveProperty('replacesDocumentId');
    }
  });

  it('CA-5: si falla la subida no se confirma; el reintento vuelve a preparar', async () => {
    const deps = makeDeps();
    deps.put.mockRejectedValueOnce(new Error('red'));
    const input = { file: fileOf(10, 'application/pdf'), documentType: 'RUT' as const };
    const error = await runExpedienteUpload(input, deps).catch((e: unknown) => e);
    expect((error as ExpedienteUploadError).stage).toBe('upload');
    expect(deps.confirm).not.toHaveBeenCalled();

    await runExpedienteUpload(input, deps);
    expect(deps.prepare).toHaveBeenCalledTimes(2);
  });

  it('un fallo al confirmar lleva la etapa "confirm"; uno al preparar, "prepare"', async () => {
    const a = makeDeps();
    a.confirm.mockRejectedValue(axiosError(400));
    const confirmErr = await runExpedienteUpload(
      { file: fileOf(10, 'application/pdf'), documentType: 'RUT' },
      a,
    ).catch((e: unknown) => e);
    expect((confirmErr as ExpedienteUploadError).stage).toBe('confirm');

    const b = makeDeps();
    b.prepare.mockRejectedValue(axiosError(400));
    const prepareErr = await runExpedienteUpload(
      { file: fileOf(10, 'application/pdf'), documentType: 'RUT' },
      b,
    ).catch((e: unknown) => e);
    expect((prepareErr as ExpedienteUploadError).stage).toBe('prepare');
    expect(b.put).not.toHaveBeenCalled();
  });

  it('P-16: el mensaje del error nunca contiene la URL firmada', async () => {
    const deps = makeDeps();
    deps.put.mockRejectedValue(new Error(`fallo en ${SIGNED_URL}`));
    const error = (await runExpedienteUpload(
      { file: fileOf(10, 'application/pdf'), documentType: 'RUT' },
      deps,
    ).catch((e: unknown) => e)) as ExpedienteUploadError;
    expect(error.message).not.toContain('r2.example.test');
    expect(error.message).not.toContain('X-Amz');
    expect(uploadErrorMessage(error)).not.toContain('r2.example.test');
  });
});

describe('uploadErrorMessage', () => {
  it('validate: su texto', () => {
    expect(uploadErrorMessage(new ExpedienteUploadError('validate', TOO_LARGE))).toBe(TOO_LARGE);
  });

  it('prepare y confirm con 400 y message: ese message', () => {
    const cause = axiosError(400, 'Solo se puede reemplazar un documento vigente.');
    expect(uploadErrorMessage(new ExpedienteUploadError('prepare', GENERIC, cause))).toBe(
      'Solo se puede reemplazar un documento vigente.',
    );
    expect(uploadErrorMessage(new ExpedienteUploadError('confirm', GENERIC, cause))).toBe(
      'Solo se puede reemplazar un documento vigente.',
    );
  });

  it('upload, 500 y red: el genérico', () => {
    expect(
      uploadErrorMessage(new ExpedienteUploadError('upload', GENERIC, axiosError(400, 'x'))),
    ).toBe(GENERIC);
    expect(
      uploadErrorMessage(new ExpedienteUploadError('prepare', GENERIC, axiosError(500, 'x'))),
    ).toBe(GENERIC);
    expect(
      uploadErrorMessage(new ExpedienteUploadError('confirm', GENERIC, new Error('red'))),
    ).toBe(GENERIC);
    expect(uploadErrorMessage(new Error('otra cosa'))).toBe(GENERIC);
  });
});

describe('shouldRefetchExpedienteAfterError', () => {
  it('true con 400 en prepare o confirm; false en el resto', () => {
    const e400 = axiosError(400, 'x');
    expect(
      shouldRefetchExpedienteAfterError(new ExpedienteUploadError('prepare', GENERIC, e400)),
    ).toBe(true);
    expect(
      shouldRefetchExpedienteAfterError(new ExpedienteUploadError('confirm', GENERIC, e400)),
    ).toBe(true);
    expect(
      shouldRefetchExpedienteAfterError(new ExpedienteUploadError('upload', GENERIC, e400)),
    ).toBe(false);
    expect(
      shouldRefetchExpedienteAfterError(new ExpedienteUploadError('validate', TOO_LARGE)),
    ).toBe(false);
    expect(
      shouldRefetchExpedienteAfterError(
        new ExpedienteUploadError('prepare', GENERIC, axiosError(500)),
      ),
    ).toBe(false);
    expect(shouldRefetchExpedienteAfterError(new Error('x'))).toBe(false);
  });
});

describe('createExpedienteUploadSchema', () => {
  const schema = createExpedienteUploadSchema(['RUT']);
  const messages = (values: unknown) => {
    const result = schema.safeParse(values);
    return result.success ? [] : result.error.issues.map((i) => i.message);
  };

  it('tipo fuera de la lista, sin archivo, archivo grande y caso válido', () => {
    const ok = fileOf(1024, 'application/pdf');
    expect(messages({ documentType: 'OTRO', file: ok })).toContain('Selecciona un tipo de documento');
    expect(messages({ documentType: 'RUT', file: undefined })).toContain('Selecciona un archivo');
    expect(messages({ documentType: 'RUT', file: fileOf(11 * MIB, 'application/pdf') })).toContain(
      TOO_LARGE,
    );
    expect(messages({ documentType: 'RUT', file: ok })).toEqual([]);
  });
});
