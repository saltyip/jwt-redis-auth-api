/**blog:
  * this files basically runs a service that helps the takes schemas for endpoint and checks safetyp and 
  *validates the body
  */

export const validate = (schema) =>(req,res,next)=>{
  const result = schema.safeParse(req.body)
  if(!result.success) return res.status(400).json(result.error.errors)
  next()
}
