/**blog:
  * ZOD is used for req.body validation so here we jsut create the scehmas for each endpoint how should
  *the body be like for each
*/
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
})

export const updateSchema = z.object({
  current_passwd: z.string().min(8).max(72),
  new_email: z.string().email().optional(),
  new_passwd:z.string().min(8).max(72).optional()

})


