const Log = require('@dazn/lambda-powertools-logger')
const CorrelationIds = require('@dazn/lambda-powertools-correlation-ids')

// config should be { sampleRate: double } where sampleRate is between 0.0-1.0
module.exports = ({ sampleRate }) => {
  const isDebugEnabled = () => {
    const correlationIds = CorrelationIds.get()

    // allow upstream to enable debug logging for the entire call chain
    if (correlationIds['debug-log-enabled'] === 'true') {
      return true
    }

    return sampleRate && Math.random() <= sampleRate
  }

  return {
    before: (handler, next) => {
      if (isDebugEnabled()) {
        Log.enableDebug()
      }

      next()
    },
    after: (handler, next) => {
      Log.resetLevel()

      next()
    },
    onError: (handler, next) => {
      if (process.env.POWERTOOLS_IGNORE_ERRORS !== 'true') {
        const awsRequestId = handler.context ? handler.context.awsRequestId : ''
        const invocationEvent = JSON.stringify(handler.event)
        Log.error('invocation failed', { awsRequestId, invocationEvent }, handler.error)
      }

      next(handler.error)
    }
  }
}
