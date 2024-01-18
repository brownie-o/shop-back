import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import routeUsers from './routes/users.js'
import routeProducts from './routes/products.js'
import routeOrders from './routes/orders.js'
import { StatusCodes } from 'http-status-codes'
import './passport/passport.js'

const app = express()

// cors: 允許哪些地方的跨域請求
app.use(cors({
  // origin (origin, callback) {}
  // origin: 請求的來源 (如果用postman, origin 會是 undefined, 後端的請求也是)
  // callback(錯誤, 是否允許)
  origin (origin, callback) {
    // 允許postman/後端, github, localhost發送請求
    if (origin === undefined || origin.includes('github') || origin.includes('localhost')) {
      callback(null, true)
    } else {
      callback(new Error('CORS'), false)
    }
  }
}))
app.use((_, req, res, next) => {
  // the client's identity is known to the server, yet clients are unauthorized
  res.status(StatusCodes.FORBIDDEN).json({
    success: false,
    message: '請求被拒絕'
  })
})

app.use(express.json())
app.use((_, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: '資料格式錯誤'
  })
})

app.use('/users', routeUsers)
app.use('/products', routeProducts)
app.use('/orders', routeOrders)

// all: POST GET 等全動作
// '*': 所有其他 undefined/.includes('github')/.includes('localhost') 以外的路徑
// 拒絕沒有被cors允許的路徑
app.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到'
  })
})

app.listen(process.env.PORT || 4000, async () => {
  console.log('伺服器啟動')
  await mongoose.connect(process.env.DB_URL)
  console.log('資料庫連線成功')
})
