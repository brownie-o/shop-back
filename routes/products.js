import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import { create, getAll, edit, get, getId } from '../controllers/products.js'
import upload from '../middlewares/upload.js'
import admin from '../middlewares/admin.js'

const router = Router()

// 先處理驗證登入(auth.jwt) 不要先處理上傳的檔案(upload)
router.post('/', auth.jwt, admin, upload, create)
// 經過jwt驗證(登入了), 且是管理員, 才可以取得資料
router.get('/all', auth.jwt, admin, getAll)
router.patch('/:id', auth.jwt, admin, upload, edit)
router.get('/', get)
router.get('/:id', getId)

export default router
