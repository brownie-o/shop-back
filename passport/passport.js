import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
import bcrypt from 'bcrypt'
import users from '../models/users.js'

// 'login' = 驗證方式
passport.use('login', new passportLocal.Strategy({
  usernameField: 'account',
  passwordField: 'password'
}, async (account, password, done) => {
  try {
    const user = await users.findOne({ account })
    if (!user) {
      throw new Error('ACCOUNT')
    }
    // bcrypt.compareSync(明文, 密文)
    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error('PASSWORD')
    }
    // done(錯誤, 資料, info)
    return done(null, user, null)
  } catch (error) {
    if (error) {
      if (error.message === 'ACCOUNT') {
        return done(null, null, { message: '帳號不存在' })
      } else if (error.message === 'PASSWORD') {
        return done(null, null, { message: '密碼錯誤' })
      } else {
        return done(null, null, { message: '未知錯誤' })
      }
    }
  }
}))

// 用passport 執行驗證策略 再執行callback => 到middlewares的auth.js
passport.use('jwt', new passportJWT.Strategy({
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true,
  // 略過過期的檢查(允許過期) - 提供舊的時可以舊換新
  ignoreExpiration: true
  // payload = 解譯出來的資料
}, async (req, payload, done) => {
  try {
    // payload.exp = JWT解譯出來的過期的日期 = 從1970到現在過了幾秒 (所以要*1000)
    // JS的 .getTime = 從1970到現在過了幾毫秒
    const expired = payload.exp * 1000 < new Date().getTime() // 取當下日期 = Date().now
    /*
      http: //localhost:4000/users/test?aaa=111&bbb=2
      req.originalUrl = /users/test?aaa=111&bbb=2
      req.baseUrl = /users
      req.path = /test
      req.query = { aaa: 111, bbb: 222 }
      */
    // baseUrl = /users 定義by app.use('/users', routeUsers) in index.js
    const url = req.baseUrl + req.path
    // 如果JWT過期且不是後面兩個url的
    if (expired && url !== '/users/extend' && url !== '/users/logout') {
      throw new Error('EXPIRED')
    }

    // 取這次請求的token
    // const token = req.headers.authroization.split(' ')
    const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    // 檢查是否有此使用者的存在 (_id = 解譯出來的id, tokens有沒有包含現在的token)
    const user = await users.findOne({ _id: payload._id, tokens: token })
    if (!user) {
      throw new Error('JWT')
    }
    // done(錯誤 /null = 成功, 成功時回傳的數據, pass additional related information)
    return done(null, { user, token }, null)
  } catch (error) {
    console.log(error)
    if (error.message === 'EXPIRED') {
      return done(null, null, { message: 'JWT 過期' })
    } else if (error.message === 'JWT') {
      return done(null, null, { message: 'JWT 無效' })
    } else {
      return done(null, null, { message: '未知錯誤' })
    }
  }
}))
