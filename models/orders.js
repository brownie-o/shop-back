import { Schema, model, ObjectId } from 'mongoose'

const cartSchema = new Schema({
  product: {
    type: ObjectId,
    ref: 'products',
    required: [true, '缺少使用者']
  },
  quantity: {
    type: Number,
    required: [true, '缺少商品數量']
  }
})

const schema = new Schema({
  user: {
    type: ObjectId,
    ref: 'users',
    required: [true, '缺少使用者']
  },
  cart: {
    type: [cartSchema],
    validate: {
      validator (value) {
        // Array.isArray(變數) 判斷變數是否為陣列
        return Array.isArray(value) && value.length > 0
      },
      message: '購物車不能為空'
    }
  }
}, { versionKey: false, timestamps: true })

export default model('orders', schema)
