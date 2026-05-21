import { getApiErrorMessage } from './http';

describe('http utils', () => {
  it('returns backend string detail messages', () => {
    expect(
      getApiErrorMessage({
        response: {
          status: 422,
          data: {
            detail: 'Uploaded PDF does not contain extractable text',
          },
        },
      }),
    ).toBe('Uploaded PDF does not contain extractable text');
  });

  it('formats FastAPI validation arrays from 422 responses', () => {
    expect(
      getApiErrorMessage({
        response: {
          status: 422,
          data: {
            detail: [
              {
                loc: ['body', 'file'],
                msg: 'Field required',
                type: 'missing',
              },
            ],
          },
        },
      }),
    ).toBe('file: Field required');
  });

  it('joins multiple validation messages', () => {
    expect(
      getApiErrorMessage({
        response: {
          status: 422,
          data: {
            detail: [
              { loc: ['body', 'email'], msg: 'Enter a valid email address' },
              { loc: ['body', 'password'], msg: 'String should have at least 8 characters' },
            ],
          },
        },
      }),
    ).toBe('email: Enter a valid email address password: String should have at least 8 characters');
  });

  it('supports backend message and error fields', () => {
    expect(
      getApiErrorMessage({
        response: {
          status: 500,
          data: {
            message: 'Service unavailable',
          },
        },
      }),
    ).toBe('Service unavailable');

    expect(
      getApiErrorMessage({
        response: {
          status: 400,
          data: {
            error: 'Invalid request',
          },
        },
      }),
    ).toBe('Invalid request');
  });
});
