import users from '../models/users.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken' // passport 套件含 jsonwebtoken
import products from '../models/products.js'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    await users.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
      // error.code === 11000 資料重複時的錯誤代碼
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '帳號已註冊'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const login = async (req, res) => {
  try {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens.push(token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        token,
        account: req.user.account,
        email: req.user.email,
        role: req.user.role,
        // .cartQuantity = virtaul欄位 > in models/users.js
        cart: req.user.cartQuantity
      }
    })
  } catch (error) {
    console.log(error)

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 登出 - 刪掉符合這次登入資訊的token
export const logout = async (req, res) => {
  try {
    // 把符合的token過濾掉 (留下來的token不等於這次logout的token)
    req.tokens = req.user.tokens.filter(token => token !== req.token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 舊換新
export const extend = async (req, res) => {
  try {
    // 找到登入的token在原始陣列是第幾個
    const idx = req.user.tokens.findIndex(token => token === req.token)
    // 簽新的token
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    // 替換token
    req.user.tokens[idx] = token
    // save
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: token
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 當使用者進到網頁時，用token取使用者的個人資訊
export const getProfile = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        account: req.user.account,
        email: req.user.email,
        role: req.user.role,
        // .cartQuantity = virtaul欄位 > in models/users.js
        cart: req.user.cartQuantity
      }
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 購物車
export const editCart = async (req, res) => {
  try {
    // 檢查進來的商品id 格式是否正確
    if (!validator.isMongoId(req.body.product)) throw new Error('ID')

    // 尋找購物車內有沒有傳入的商品ID
    // item.product 是ObjectId, 所以要 toString
    const idx = req.user.cart.findIndex(item => item.product.toString() === req.body.product)
    // 如果購物車有東西
    if (idx > -1) {
      // 修改購物車內已有的商品數量
      const quantity = req.user.cart[idx].quantity + parseInt(req.body.quantity)
      // 檢查數量
      if (quantity <= 0) {
        // 小於 0 ，移除
        req.user.cart.splice(idx, 1)
      } else {
        // 大於 0 ，修改
        req.user.cart[idx].quantity = quantity
      }
    } else {
      // 檢查商品是否存在或已下架
      const product = await products.findById(req.body.product).orFail(new Error('NOT FOUND'))
      if (!product.sell) {
        throw new Error('NOT FOUND')
      } else {
        req.user.cart.push({
          product: product._id,
          quantity: req.body.quantity
        })
      }
    }
    // 保存使用者資料 把目前商品數回給前端
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.cartQuantity
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_GATEWAY).json({
        success: false,
        message
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const getCart = async (req, res) => {
  try {
    // .populate() 把相關的資料帶出來 要在原本的資料(cart.product)寫ref
    const result = await users.findById(req.user._id, 'cart').populate('cart.product')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.cart
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
