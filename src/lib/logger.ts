// Production-safe logger that only outputs in development
// Prevents sensitive error details from being exposed in production browser console

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.error(message, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.warn(message, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.info(message, ...args);
    }
  },
  log: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(message, ...args);
    }
  },
};
