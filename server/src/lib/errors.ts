import type { ApiErrorDetail } from '../../../shared/types';

/** Ismert, a kliensnek szánt hiba HTTP-státuszkóddal és gépileg olvasható kóddal. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message: string) => new HttpError(404, 'NOT_FOUND', message);

export const badRequest = (message: string, details?: ApiErrorDetail[]) =>
  new HttpError(400, 'VALIDATION_ERROR', message, details);

export const conflict = (message: string) => new HttpError(409, 'CONFLICT', message);
