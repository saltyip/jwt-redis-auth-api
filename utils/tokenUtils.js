/**blog:
  * this file takes care of the jwt process and functions
  *   1)create access
  *   2)verify access
  *   3)create refresh
  *   4)hash refresh
  *
  * 1) -> this is done using jwt.sign -> creates a payload -> with secrte expirty and userId 
  * 2) -> the token is then verified with the secret and if expired it expired cancel it if the decoding or whatever with secret doesnt work then also 
  *       cancel but if it works then the token will output the userId it points to 
  * 3) -> refresh token just a random string
  * 4) -> refrsh token is hashed as its stored in db -> its hashed in sha256 
  *
  */  

import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (userId) => {   //access token gen using jwt sign cretes a payload 
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { //uses the secret and expiry in env all done wihtin jwt
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
}; //access token with secret(for secret ) and expiry all done in jwt

export const generateRefreshToken = () => {  //creates random set of hex base string as refresh token
  return crypto.randomBytes(40).toString("hex");
};

export const hashToken = (token) => {  //hashes the refresh token so that it can be saved securly in db 
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyAccessToken = (token) => {  //jwt automatically verifies with the acccesstoken with the secret and expirty in it and gives teh error and returns valuea as needed all in jwt
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};
