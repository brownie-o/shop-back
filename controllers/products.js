import products from '../models/products.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    // chat.gpt: 在 req.body 物件中設定了一個名為 image 的屬性，而此屬性的值(req.file.path)是上傳檔案的檔案路徑
    // const data = { ...req.body, image: req.file.path }
    req.body.image = req.file.path
    const result = await products.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
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

// 查所有的, for 後端
export const getAll = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = parseInt(req.query.sortOrder) || -1
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 20
    const page = parseInt(req.query.page) || 1
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await products
      .find({
        $or: [
          { name: regex },
          { description: regex }
        ]
      })
      // [把陣列的值當作欄位的key ]
      // const text = 'a'
      // const obj = { [text]: 1 }
      // obj.a = 1
      .sort({ [sortBy]: sortOrder })
      // 如果一頁十筆
      // 第一頁 = 0 ~ 10 = 跳過 0 筆 = (1 - 1)*10
      // 第二頁 = 11 ~ 20 = 跳過 10 筆 = (2 - 1)*10
      // 第三頁 = 21 ~ 30 = 跳過 20 筆 = (3 - 1)*10
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage === -1 ? undefined : itemsPerPage)

    // estimatedDocumentCount() 計算資料總數 但裡面不能放篩選
    // Mongoose: Estimates the number of documents in the MongoDB collection. Faster than using countDocuments() for large collections because estimatedDocumentCount() uses collection metadata rather than scanning the entire collection.
    const total = await products.estimatedDocumentCount()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 只能查詢有上架的，顯示在首頁
export const get = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = parseInt(req.query.sortOrder) || -1
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 20
    const page = parseInt(req.query.page) || 1
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await products
      .find({
        sell: true,
        $or: [
          { name: regex },
          { description: regex }
        ]
      })
      // [把陣列的值當作欄位的key ]
      // const text = 'a'
      // const obj = { [text]: 1 }
      // obj.a = 1
      .sort({ [sortBy]: sortOrder })
      // 如果一頁十筆
      // 第一頁 = 0 ~ 10 = 跳過 0 筆 = (1 - 1)*10
      // 第二頁 = 11 ~ 20 = 跳過 10 筆 = (2 - 1)*10
      // 第三頁 = 21 ~ 30 = 跳過 20 筆 = (3 - 1)*10
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage === -1 ? undefined : itemsPerPage)

    // countDocuments( 篩選條件 )
    const total = await products.countDocuments({ sell: true })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
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

// 查詢
export const getId = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const result = await products.findById(req.params.id)

    if (!result) throw new Error('NOT FOUND')

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
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
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const edit = async (req, res) => {
  try {
    // 檢查ID 不對就error
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    req.body.image = req.file?.path
    // .orFail(發生錯誤的內容) : 如果發生錯誤
    // req.body = 要更新的內容，如果是undefined, 就不會更新
    // runValidators: 預設是false
    await products.findByIdAndUpdate(req.params.id, req.body, { runValidators: true }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
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
