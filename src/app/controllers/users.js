import User from '../models/user'
import {
  buildErrObject,
  handleError,
  isIDGood,
  buildSuccObject,
  itemNotFound,
  generateToken,
  verifyTheToken
} from '../middleware/utils'

const cryptoRandomString = require('crypto-random-string')
const db = require('../middleware/db')
const emailer = require('../middleware/emailer')

/**
 * Creates a new item in database
 * @param {Object} req - request object
 */
const createItem = async req => {
  return new Promise((resolve, reject) => {
    User.create(
      {
        name: req.name,
        email: req.email,
        password: req.password,
        country: req.country,
        phone: req.phone,
        role: req.role,
        city: req.city,
        verification: cryptoRandomString({length: 32, type: 'base64'})
      },
      (err, item) => {
        if (err) {
          reject(buildErrObject(422, err.message))
        }
        const removeProperties = ({
          // eslint-disable-next-line no-unused-vars
          password,
          // eslint-disable-next-line no-unused-vars
          blockExpires,
          // eslint-disable-next-line no-unused-vars
          loginAttempts,
          ...rest
        }) => rest
        resolve(removeProperties(item.toObject()))
      }
    )
  })
}

/**
 * Builds the registration token
 * @param {Object} item - user object that contains created id
 * @param {Object} userInfo - user object
 */
const returnRegisterToken = item => {
  const data = {
    id: item._id,
    name: item.name,
    email: item.email,
    verified: item.verified,
    token: generateToken(item.verification),
  }
  return data
}

/**
 * Verifies an user
 * @param {Object} user - user object
 */
const verify = async user => {
  return new Promise((resolve, reject) => {
    user.verified = true // eslint-disable-line
    user.save((err, item) => {
      if (err) {
        reject(buildErrObject(422, err.message))
      }
      resolve({
        email: item.email,
        verified: item.verified,
      })
    })
  })
}

/**
 * Checks if verification id exists for user
 * @param {string} id - verification id
 */
const verificationExists = async verification => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        verification
      },
      (err, user) => {
        if (err) {
          itemNotFound(err, user, reject, 'NOT_FOUND_OR_ALREADY_VERIFIED')
        }
        resolve(user)
      }
    )
  })
}

/********************
 * Public functions *
 ********************/

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
export const getUsers = async (req, res) => {
  try {
    const query = await db.checkQueryString(req.query)
    res.status(200).json(await db.getItems(req, User, query))
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
export const getUser = async (req, res) => {
  try {
    const id = await isIDGood(req.id)
    res.status(200).json(await db.getItem(id, User))
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
export const updateUser = async (req, res) => {
  try {
    const id = await isIDGood(req.id)
    const doesEmailExists = await emailer.emailExistsExcludingMyself(
      id,
      req.email
    )
    if (!doesEmailExists) {
      res.status(200).json(await db.updateItem(id, User, req))
    }
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
export const createNewUser = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    const doesEmailExists = await emailer.emailExists(req.body.email)
    if (!doesEmailExists) {
      const item = await createItem(req.body)
      const response = returnRegisterToken(item)
      res.status(201).json(buildSuccObject(response))
    }
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * Verify function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
export const verifyUser = async (req, res) => {
  try {
    const verifiedToken = await verifyTheToken(req.body.token)
    const user = await verificationExists(verifiedToken)
    if (verifiedToken && user.verification === verifiedToken) {
      const verifiedUser = await verify(user)
      res.status(200).json(verifiedUser)
    }
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * Delete item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
export const deleteUser = async (req, res) => {
  try {
    const id = await isIDGood(req.id)
    res.status(200).json(await db.deleteItem(id, User))
  } catch (error) {
    handleError(res, error)
  }
}
