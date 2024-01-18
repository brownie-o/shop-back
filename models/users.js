import { Schema, model, ObjectId, Error } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import UserRole from '../enums/UserRole.js'

const cartSchema = new Schema({
  product: {
    type: ObjectId,
    ref: 'products',
    required: [true, '缺少商品欄位']
  },
  quantity: {
    type: Number,
    required: [true, '缺少商品數量']
  }
})

const schema = new Schema({
  account: {
    type: String,
    required: [true, '缺少使用者帳號'],
    minlenght: [4, '使用者帳號長度不符'],
    maxlenght: [20, '使用者帳號長度不符'],
    unique: true,
    validate: {
      validator (value) {
        // .isAlphanumeric(): Analyse if a char is alphanumeric (that is a letter or a numbers)
        return validator.isAlphanumeric(value)
      },
      message: '使用者帳號格式錯誤'
    }
  },
  email: {
    type: String,
    required: [true, '缺少使用者信箱'],
    unique: true,
    validate: {
      validator (value) {
        return validator.isEmail(value)
      },
      message: '使用者信箱格式錯誤'
    }
  },
  password: {
    type: String,
    required: [true, '缺少使用者密碼']
    // 保存密碼之前才會驗證密碼 然後加密
  },
  tokens: {
    type: [String]
  },
  cart: {
    type: [cartSchema]
  },
  // 一般使用者 or 管理員
  role: {
    type: Number,
    default: UserRole.USER
  }
}, {
  // 會新增建立&更新日期(createdAt, updatedAt)
  // versionKey: false 不要存資料改了幾次 (關掉 __v)
  timestamps: true,
  versionKey: false
})

// 建立虛擬欄位
schema.virtual('cartQuantity')
  .get(function () {
    // [...].reduce((total, current) => {}, 初始值)
    // 取cart 中有幾個商品的數量就好
    return this.cart.reduce((total, current) => {
      // 計算每個陣列的數量加總
      return total + current.quantity
    }, 0)
  })

schema.pre('save', function (next) {
  const user = this
  if (user.isModified('password')) {
    if (user.password.length < 4 || user.password.length > 20) {
      const error = new Error.ValidationError(null)
      error.addError('password', new Error.ValidatorError({ message: '密碼長度不符' }))
      next(error)
      return
    } else {
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }
  next()
})

export default model('users', schema)
