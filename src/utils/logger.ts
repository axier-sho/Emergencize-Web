type LogArguments = [message: string, ...args: unknown[]]

const format = (level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG', message: string) =>
  `[${level}] ${message}`

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(format('INFO', message), ...args)
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(format('ERROR', message), ...args)
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(format('WARN', message), ...args)
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(format('DEBUG', message), ...args)
    }
  }
}

