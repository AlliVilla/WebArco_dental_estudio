import { errorDiagnostic } from './error-diagnostic';
import { AllExceptionsFilter } from '../filters/http-exception.filter';

describe('Safe server error diagnostics', () => {
  const prismaError = () =>
    Object.assign(new Error('SQL with password=private'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2021',
      meta: { modelName: 'Usuario', query: 'private SQL', password: 'private' },
    });
  it('retains only the Prisma code and model identifier', () => {
    expect(errorDiagnostic(prismaError())).toEqual({
      name: 'PrismaClientKnownRequestError',
      code: 'P2021',
      model: 'Usuario',
    });
  });
  it('does not log arbitrary messages, codes, names or metadata', () => {
    const error = Object.assign(new Error('private message'), {
      name: 'private name',
      code: 'private code',
      meta: { modelName: 'private input' },
    });
    expect(errorDiagnostic(error)).toEqual({ name: 'Error' });
    expect(errorDiagnostic({ password: 'private' })).toEqual({
      name: 'UnknownError',
    });
  });
  it('rejects non-identifier model metadata', () => {
    const error = prismaError();
    error.meta.modelName = 'Usuario: private input';
    expect(errorDiagnostic(error)).toEqual({
      name: 'PrismaClientKnownRequestError',
      code: 'P2021',
    });
  });
  it('preserves generic public errors while recording the safe diagnostic server-side', () => {
    const log = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      new AllExceptionsFilter().catch(prismaError(), {
        switchToHttp: () => ({ getResponse: () => ({ status }) }),
      } as any);
      expect(log).toHaveBeenCalledWith('Unhandled Exception:', {
        name: 'PrismaClientKnownRequestError',
        code: 'P2021',
        model: 'Usuario',
      });
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Error interno del servidor',
      });
    } finally {
      log.mockRestore();
    }
  });
});
