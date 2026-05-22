import {getProfile , updateProfile} from './user.controller.js'
import {Router} from 'express';
import {protect} from '../../middleware/auth.middleware.js'
import {updateSchema} from '../../middleware/schemas.js'
import {validate} from '../../middleware/validate.js'
const router = Router()

router.get('/profile',protect,getProfile)
router.patch('/updateprofile',validate(updateSchema),protect,updateProfile)
export default router
