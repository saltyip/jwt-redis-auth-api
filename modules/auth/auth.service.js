//this file contains the functions related to fn of user, these will later be used to create functions at each end point (ex register enpoint will have a fn where it takes user and password right thats will be written here thats all  so it would be endpoijnt regiter under that this register function easy) 
//    register, login , refreshing token, log out 

import pool from "../../config/db.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {generateAccessToken,generateRefreshToken,hashToken} from "../../utils/tokenUtils.js";


export const registerUser = async (email, password) => {
  const existing = await pool.query("SELECT id from users WHERE email = $1",[email,]);
  if (existing.rows.length > 0) throw { status: 409, message: "Email already in use" };

  const password_hash = await bcrypt.hash(password, 12)
  const result = await pool.query("INSERT INTO users (email,password_hash) VALUES ($1,$2) RETURNING id",[email, password_hash]);
  return result.rows[0].id;
};

export const loginUser = async (email, password) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  if (!result.rows[0]) throw { status: 401, message: "Invalid Credentials" };

  const valid = await bcrypt.compare(password, result.rows[0].password_hash);
  if (!valid) throw { status: 401, message: "Invalid Creadentials" };

  const accessToken = generateAccessToken(result.rows[0].id); //creates the acessToken with payload as userid
  const refreshToken = generateRefreshToken(); //created refresh token (random text string )
  const tokenHash = hashToken(refreshToken); //hashes refresh token in sha256 
  const familyId = uuidv4(); //creates a familyId
 
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
    [result.rows[0].id, tokenHash, familyId]
  )
  
  return {accessToken,refreshToken}
};

export const refreshTokens = async(incomingToken) =>{
  const tokenHash = hashToken(incomingToken)

  const result = await pool.query("SELECT * FROM refresh_tokens WHERE token_hash = $1",[tokenHash])
  const stored = result.rows[0];

  if(!stored) throw {status:403, message:"Invalid refresh token "}

  if(stored.is_revoked){
    await pool.query('UPDATE refresh_tokens SET is_revoked = true WHERE family_id = $1',[stored.family_id])
    throw {status:403, message:"Token reuse detected"}
  }

  if(new Date(stored.expires_at) < new Date()){
    throw { status:403, message:"Refresh token expired"}
  }

  await pool.query('UPDATE refresh_tokens SET is_revoked = true WHERE id=$1',[stored.id])
  
  const newRefreshToken = generateRefreshToken()
  const newTokenHash = hashToken(newRefreshToken)

  await pool.query("INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')",[stored.user_id,newTokenHash,stored.family_id])
 
  const accessToken = generateAccessToken(stored.user_id)
  return {accessToken,refreshToken: newRefreshToken}

}

export const logoutUser = async(incomingToken,userId)=>{
  const tokenHash = hashToken(incomingToken)
  const result = await pool.query('SELECT * FROM refresh_tokens WHERE token_hash=$1',[tokenHash])
  const storedUser = result.rows[0]

  if(!storedUser) throw{status:403,message:"Invalid Refresh Token"}

  if(storedUser.user_id != userId) throw{status:403,message:"Forbidden"}

  await pool.query('UPDATE refresh_tokens SET is_revoked= true WHERE token_hash=$1',[tokenHash])

}














