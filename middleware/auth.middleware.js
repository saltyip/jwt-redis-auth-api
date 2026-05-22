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
