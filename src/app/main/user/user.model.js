const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')
const bcrypt = require('bcrypt')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: 'EMAIL_IS_NOT_VALID'
      },
      lowercase: true,
      unique: true,
      required: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    photo: {
      id: {
        type: String,
      },
      url: {
        type: String,
      }
    },
    clerance: {
      type: Array,
    },
    verification: {
      type: String
    },
    verified: {
      type: Boolean,
      default: false
    },
    phone: {
      type: String
    },
    city: {
      type: String
    },
    country: {
      type: String
    },
    baseStation: {
      type: String
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    blockExpires: {
      type: Date,
      default: Date.now,
      select: false
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

const hash = (user, salt, next) => {
  bcrypt.hash(user.password, salt, (error, newHash) => {
    if (error) {
      return next(error)
    }
    user.password = newHash // eslint-disable-line
    return next()
  })
}

UserSchema.pre('save', function(next) { // eslint-disable-line
  const that = this
  const SALT_FACTOR = 10
  if (!that.isModified('password')) {
    return next()
  }
  return hash(that, SALT_FACTOR, next)
})

UserSchema.methods.comparePassword = function(passwordAttempt, cb) { // eslint-disable-line
  bcrypt.compare(
    passwordAttempt,
    this.password,
    (err, isMatch) => (err ? cb(err) : cb(null, isMatch))
  )
}

UserSchema.plugin(mongoosePaginate)

/**
 * We are using mongoose delete plugin for soft deletes. 
 * @SEE for details : https://github.com/dsanel/mongoose-delete
 */
UserSchema.plugin(mongooseDelete, { overrideMethods: true, deletedBy : true, deletedAt : true})

const User = mongoose.model('User', UserSchema)

export default User
