import { getProfile as getProfilefn, updateProfile as updateProfilefn } from './user.service.js'
import  catchAsync  from '../../utils/catchAsync.js'


export const getProfile = catchAsync(async (req, res) => {
  const user = await getProfilefn(req.user.userId);
  res.status(200).json(user)
})

export const updateProfile = catchAsync(async (req, res) => {
  await updateProfilefn(req.user.userId, req.body.current_passwd, req.body.new_email, req.body.new_passwd)
  res.status(200).json({ message: "Changed" })
})
