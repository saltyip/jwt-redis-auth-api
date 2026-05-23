/**blog:
  * this file contains the functions related to fn of user, these will later be used to create functions at each end point (ex register enpoint will have a fn where it takes user and password right thats will be written here thats all  so it would be endpoijnt regiter under that this register function easy) 
  * register, login , refreshing token, log out 
  * working of each ->
  * 1)register user -> needs input email and pass -> check if email exist -> if not -> hash the password -> save it in db -> return the user id 
  * 2)login user -> get email and pass  -> check if email exist -> yes -> check password by bcrypt.compare -> if correct -> create accessToken,refresh token,hash refresh -> save it in 
  *                 refresh token db along with familyId(uuid) and expires_at time
  * 3)refreshing the refresh -> here accessToken is refreshed -> we need refresh token to check -> innput is incomingtoken from cookies -> we 
  *                             we hash compare this also and check if it exist -> if yes -> we get the userid -> now we need to give a new accessToken byu generate fn  
  *         the important thing in 3 is we do another thing also 
    *           familyId and is revoked status is checked and refresh token is refreshed along with accessToken 
    *           so basically when accessToken need refresh it hits this endpoint
    *           here then refresh token is first checked (exists, not_revoked(that is check if its not old/used before)),expiry) if all checks passed 
    *             then it changes refresh token hashes and store it in db and the old refresh token's -> is_revoked thing -> becomes true -> signifying 
    *             the refresh token cant be used anymore as the revoked test it would fail
    *             Family id fn -> the function of this is if attacker uses the refresh token before u then he gets a new refresh token -> which gives him a new
    *             accessToken also thus making u not have control till refresh token expires 
  *               but with family_id as the refresh_tokne the attacker gets used as status revoked then everry refresh token in that list witht the familyId
    *             gets revoked also so ull have to relogin but prevernts atatcker from using your account 
  *
  * 4)log out -> for log out -> need userID and token -> need user id cuz to log out that user yk -> the user id should be checked thru accessToken verification->
    *            we again use refresh token to find the user by comparing hash ->after we get the user thru refresh tokekn -> we check or match it with our accessToken to fcheck if its the same uer ->if yes -> then when found -> we revoke his refresh token  
  *
    * learning -> IDOR pattern of attacking , XSS and cookie stealing , how to avoid and using family_id and appropriate checks
  */
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














