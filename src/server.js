import http from 'http'
import chalk from 'chalk'
import socket from 'socket.io'

import apolloServer from './core/graphql'
import app from './app'
import mongoose from './core/mongo'
import conf from './core/config'
import { log } from './core/logger'

// include and initialize the rollbar library with your access token
// const Rollbar = require('rollbar')

// const rollbar = new Rollbar({
//   accessToken: 'f442d8c998864f629924b0f38fd4596a',
//   captureUncaught: true,
//   captureUnhandledRejections: true
// })

// record a generic message and send it to Rollbar
// rollbar.log('Hello world!')

const port = conf.get('PORT') || 3000
console.log(port)
const server = http.Server(app)

mongoose.Promise = require('bluebird')

apolloServer.installSubscriptionHandlers(server)
apolloServer.applyMiddleware({
  app,
  path: '/graphql',
  cors: {
    credentials: true,
    origin: 'http://localhost:3000'
  }
})

export const io = socket(server)
io.origins(['*:*'])

io.on('connection', connSocket => {
  console.log(chalk.hex('#009688')(' [*] Socket: Connection Succeeded.'))
  connSocket.on('disconnect', () =>
    console.log(chalk.hex('#009688')(' [*] Socket: Disconnected.'))
  )
})

mongoose.connection.once('open', () => {
  log.info(`Mongoose has connected`)
})

// I have to refactor it for Mocha-Chai Tests
export const Application = server.listen(port, () =>
  log.info(`Server has started at ${port}`)
)

server.on('error', err => {
  log.error('error', err, {
    isExpressError: true
  })
})

server.on('close', () => {
  log.info('Server has been closed by Admin')
})

process.on('SIGINT', () => {
  mongoose.connection.close()
  server.close()
})

// To Mocha-Chai Tests
export const stop = () => {
  mongoose.connection.close()
  server.close()
}
