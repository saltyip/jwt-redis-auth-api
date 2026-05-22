//this file consists of the endpoint functions so ye at each point what should each endpoint do those fn 
import {registerUser, loginUser,refreshTokens,logoutUser } from './auth.service.js'
import {catchAsync} from '../../utils/catchAsync.js'
export const register = catchAsync(async(req,res)=>{
  const {email,password} = req.body
  await registerUser(email,password)
  res.status(201).json({message:"User created"}) 
})

export const login = catchAsync(async(req,res)=>{
  const {email,password} = req.body
  const {accessToken, refreshToken} = await loginUser(email,password);

  res.cookie('refreshToken',refreshToken, {
    httpOnly : true,
    secure: true,
    sameSite:'strict',
    maxAge: 7*24*60*60*1000
  })
  res.status(201).json({accessToken})
})

export const refresh = catchAsync(async(req,res)=>{
  const token = req.cookies.refreshToken;
  if(!token) return res.status(401).json({message:"No refreshToken"})
  const {accessToken,refreshToken} = await refreshTokens(token)

  res.cookie('refreshToken',refreshToken, {
    httpOnly:true,
    secure:true,
    sameSite:'strict',
    maxAge: 7*24*60*60*1000
  })
   
  res.status(201).json({accessToken})

})
export const logout = catchAsync(async(req,res)=>{
  const token = req.cookies.refreshToken;
  await logoutUser(token,req.user.userId);

  res.status(204).send()
})








