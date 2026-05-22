import {Router } from 'express'
import {register, login,refresh,logout} from './auth.controller.js'
import {protect} from '../../middleware/auth.middleware.js'
import { loginenpoint,registerendpoint } from '../../middleware/redis.middleware.js'
import {registerSchema,loginSchema} from '../../middleware/schemas.js'
import {validate} from '../../middleware/validate.js'
const router = Router()
router.post('/register',validate(registerSchema),registerendpoint,register)
router.post('/login',validate(loginSchema),loginenpoint,login)
router.post('/refresh',refresh)
router.post('/logout',protect,logout)
export default router
