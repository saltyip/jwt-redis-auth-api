import client from '../config/redis.js'

export const loginenpoint = async (req,res,next)=>{
  const key = "login_attempt:"+req.ip;
  const attempt = await client.incr(key)
  if(attempt === 1) await client.expire(key,900)//15*60
  if(attempt>10)return res.status(429).json({message:'Too many attempts'})
  next()
}

export const registerendpoint = async(req,res,next)=>{
  const key = "register_attempt:"+req.ip;
  const attempt = await client.incr(key)
  if(attempt==1) await client.expire(key,3600)//60*60
  if(attempt>5)return res.status(429).json({message:"Too many attempts"})
  next()
}
