//this file takes care of 
//  jwt token function like = generateaccestoken , genrate refresh , hashing the refresh token, verifying accesstoken 
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
