const conf = require('nconf');
import { version } from '../../package.json'
import { join, resolve } from 'path'

const PATH_TO_CONFIG = join(resolve(__dirname, '../../config.json'));

conf
  .argv()
  .env()
  .file({
    file: PATH_TO_CONFIG
  })

conf.set('VERSION', version)
conf.set('IS_PROD', process.env.NODE_ENV === 'production')
conf.set('IS_DEV', process.env.NODE_ENV === 'development')
conf.set('IS_TEST', process.env.NODE_ENV === 'test')


export default conf