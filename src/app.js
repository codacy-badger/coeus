import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import cors from 'cors'
import passport from 'passport'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import morgan from 'morgan'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
// import history from 'express-history-api-fallback'
// 
import routes from './core/express'
import conf from './core/config'
import { log } from './core/logger'
import User from '~/app/main/user/user.model'

const uuid = require('uuid/v4')

const MongoStore = require('connect-mongo')(session)


const RATE_LIMIT = conf.get('RATE_LIMIT') || 0

const app = express()

// Middlewares.
app.use(helmet())
app.use(
  cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'Date', 'X-Request-Id']
  })
)
app.use(rateLimit({ max: Number(RATE_LIMIT), windowMs: 15 * 60 * 1000 }))
app.use(compression())
app.use(
  session({
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    name: conf.get('SESSION_NAME'),
    secret: conf.get('EXPRESS_SESSION_SECRET'),
    resave: true,
    rolling: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * conf.get('COOKIE_EXPIRATION_IN_DAYS'),
      sameSite: true,
      httpOnly: true,
      secure: conf.get('IS_PROD')
    }
  })
)

// for parsing json
app.use(
  bodyParser.json({
    limit: '20mb'
  })
)
// for parsing application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    limit: '20mb',
    extended: true
  })
)

app.use(cookieParser(conf.get('COOKIE_SECRET')))

const sendReq = (req, res) => {
  console.log(req)
  console.log(res)
  console.log('Cookies: ', req.cookies)
  console.log('Signed Cookies: ', req.signedCookies)
  console.log(req.session)
  
  
}

morgan.token('user', (req, res) => {
//  sendReq(req, res)
  if(req.user) {
    return req.user.name
  }
  return 'ANONYMOUS PERSONEL'
})

if (conf.get('IS_PROD')) {
  app.use(morgan('combined'))
} else {
  app.use(
    morgan(':method :url :status :response-time ms - User: :user', {
      skip(req, res) {
        return res.statusCode >= 400
      },
      stream: { write: message => log.access(message) }
    })
  )
}

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
  done(null, user.id);
});


passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      console.log(`Error: ${error}`);
    });
});


app.get('/healthcheck', (req, res) =>
  res
    .json({
      service: 'Coeus API',
      version: conf.get('VERSION')
    })
    .status(200)
)

app.get('/clear_cookie', (req, res) => {
  res.clearCookie('COEUS_JWT')
  res.send('COEUS_JWT removed').status(200)
})

app.use('/__', routes)

export default app
