/**blog:
  * this file takes care of the authentication or to check whether the user is actually the user 
*basically the accessToken check thingy happens here

*1)why middleware => cuz its used before any user process like for getProfile and updateProfile
*                    we need to verify the user is really user


*working 
*  req.header.authorization has the auth header
*  if valid header then -> split the header at pos 1 (AUTHORIZATION BEARER KEY ) etc form which is our token 
*  we check the accessToken we verify it usign the token we got from above 
*  use jwt.verify => checks the accessToken with secret key and also checks expired
*  if any of it fails then returns false ans doesnt move on if it doesnt go wrong and not expired then 
*  it returns the userId we got from the token 
*  SO BASIALLY WE GET THE userID the accessToken points to (if the accessToken is valid and not expired)
*  then we put the userId we got from the token in the req.user so that other fn can know which use it is 
*/
import { verifyAccessToken } from "../utils/tokenUtils.js"

export const protect = (req,res,next)=>{
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({status:403,message:"Invalid Access Token"})
  const token = authHeader.split(' ')[1]
  
  try {
  const decoded = verifyAccessToken(token)
  req.user = decoded
  next()
} catch {
  return res.status(401).json({ message: 'Invalid or expired token' })
} 
}
