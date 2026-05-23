/**blog:
  * this file takes care of the redis services of rate limiting 
  *  where use redis->
  *1)at login enddpoint -> cuz if unlimited amount of attempts given for a user to try login they 
  *                        could try bruteforcing their way throught the user password 
  *2)at register endpoint -> cuz if unlimited amount of attempts given for a user they could try botting 
   *                         and creating multiples accounts for no reason 
 *we put a limit to those based on time using redis 
*
*redis property used -> createing a key value pair , incr and setting expiry for that if icr crosses value then too many attempts
*
 *working->
 * for login_Attempt -> we create a key value pair login_attempt: + ip_of_user 
  *so this then we incr its value for each attempt (as its a middleware can be put before login service)
  *and we also set a expirty for it 
  *so if within that expiry time it crosses 10 times then its roo many attempts and return the user
  *if he gets it then automatically after the period of time the key value pair expires
  *next() go next fn 
    
  *same with register endpint also but more time given to allow for mistype of email etc   
  */ 

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
