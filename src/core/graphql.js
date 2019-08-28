import 'dotenv/config'
import { ApolloServer, AuthenticationError } from 'apollo-server-express'
import { PubSub } from 'graphql-subscriptions'
import Redis from 'ioredis'
import { RedisCache } from 'apollo-server-cache-redis';
import depthLimit from 'graphql-depth-limit';
import costAnalysis from 'graphql-cost-analysis';
import { importSchema } from 'graphql-import'
import { mergeTypes, fileLoader } from 'merge-graphql-schemas'
import { resolve } from 'path'
import DataLoader from 'dataloader'
import { jwtExtractor } from './passport'

import schema from '../app/graphql/schema';



const config =
  process.env.NODE_ENV === 'production' && !process.env.FORCE_DEV
    ? {
        port: process.env.REDIS_CACHE_PORT,
        host: process.env.REDIS_CACHE_URL,
        password: process.env.REDIS_CACHE_PASSWORD,
      }
    : undefined;

const redisCache = new Redis(config);

// const typeDefs = mergeTypes(
//  fileLoader(resolve(__dirname, '../app/graphql/schema'))
// );

export const pubsub = new PubSub()

export default new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
  formatError: error => {
    // remove the internal sequelize error message
    // leave only the important validation error
    const message = error.message
      .replace('SequelizeValidationError: ', '')
      .replace('Validation error: ', '')

    return {
      ...error,
      message
    }
  },
  context: async () => {},
  schemaDirectives: {},
  playground:
    process.env.NODE_ENV.trim() !== 'development'
      ? false
      : {
          settings: {
            'request.credentials': 'include',
            'schema.polling.enable': false
          }
        },
  subscriptions: {
    onConnect: () => {},
    onDisconnect: () => {}
  },
  maxFileSize: 25 * 1024 * 1024, // 25MB
  debug: process.env.NODE_ENV !== 'production',
  engine: false,
  tracing: false,
  validationRules: [
    depthLimit(10),
  ],
  cacheControl: {
    calculateHttpHeaders: false,
    // Cache everything for at least a minute since we only cache public responses
    defaultMaxAge: 60
  },
  cache: new RedisCache({
    redisCache,
    prefix: 'apollo-cache:'
  })
})