const format = (level, message) => `[${level}] ${message}`

const logger = {
  info(message, ...args) {
    console.log(format('INFO', message), ...args)
  },
  error(message, ...args) {
    console.error(format('ERROR', message), ...args)
  },
  warn(message, ...args) {
    console.warn(format('WARN', message), ...args)
  },
  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(format('DEBUG', message), ...args)
    }
  }
}

module.exports = { logger }

