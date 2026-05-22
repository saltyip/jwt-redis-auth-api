import client from '../../config/redis.js'
import pool from '../../config/db.js'
import bcrypt from 'bcrypt'
export const getProfile = async (userId)=>{
  const cache = await client.get('profile:'+userId)
  if(cache)return JSON.parse(cache) 
  const result = await pool.query("SELECT id,email,created_at FROM users WHERE id = $1",[userId])
  const user = result.rows[0];
  
  if(!user) throw{status:401,message:"Invalid User"}
  //await client.set('profile:'+userId,JSON.stringify(user));
  //await client.expire('profile:'+userId,300)
  await client.set('profile:'+userId, JSON.stringify(user), { EX: 300 })
  return user;
}


//Never select * from users 
export const updateProfile = async(userId,current_passwd,new_email=null,new_passwd=null) => {
  const result = await pool.query("SELECT id,password_hash FROM users WHERE id = $1",[userId])
  const user = result.rows[0];

  if(!user) throw{status:404,message:"Invalid User"}
  if(!current_passwd) throw{status:400,message:"current_passwd field is empty"}
  if(!new_email && !new_passwd) throw {status:400 , message:"Nothing Changed"}
 const match = await bcrypt.compare(current_passwd,user.password_hash)
  if(!match)  throw{status:401, message:"incorrect password"}

  if(new_email){
      await pool.query("UPDATE users SET email = $1 WHERE id = $2",[new_email,userId])
  }
  if(new_passwd){
    const passwordHash = await bcrypt.hash(new_passwd,12)
    await pool.query("UPDATE users set password_hash = $1 WHERE id = $2",[passwordHash,userId])
  }
  await client.del('profile:'+userId)
  return {message:"Successfully Changed"}
}
