import { Request, Response, NextFunction } from 'express';

// Middleware to catch 404 Route Not Found
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error('Route not found');
  res.status(404);
  next(error);
};

// Global error handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // For unexpected 500 errors, mask the real message to the client, but log it.
  if (statusCode >= 500) {
    console.error(`[Error] ${message}`, err.stack);
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
