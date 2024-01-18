import passport from 'passport'
import { StatusCodes } from 'http-status-codes'
import jsonwebtoken from 'jsonwebtoken'

export const login = (req, res, next) => {
  // 這邊的 'login' 對應到 passport.js的驗證方式
  passport.authenticate('login', { session: false }, (error, user, info) => {
    if (!user || error) {
      if (info.message === 'Missing credentials') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '欄位錯誤'
        })
        return
      } else if (info.message === '未知錯誤') {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
        return
      } else {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: info.message
        })
        return
      }
    }
    req.user = user
    next()
  })(req, res, next)
}

export const jwt = (req, res, next) => {
  // 'jwt' = 使用jwt 進行驗證
  // { session: false } = 不需要在伺服器上創建session
  // (error, data, info) => {...} = 身分驗證後的callback function
  passport.authenticate('jwt', { session: false }, (error, data, info) => {
    if (error || !data) {
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        console.log(error)
        // JWT 格式不對、SECRET 不對
        // 不用判斷是否過期 一定是JWT無效才會來這裡
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'JWT 無效'
        })
      } else if (info.message === '未知錯誤') {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
      } else {
        // 其他錯誤
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: info.message
        })
      }
      return
    }
    req.user = data.user
    req.token = data.token
    next()
  })(req, res, next)
}
