import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";

const app = express();

app.use(express.json()); //for json parsing 
app.use(cookieParser()); //for cookies functions with refresh token 

app.use("/api/auth", authRoutes);  //auth router for auth routes
app.use("/api/user", userRoutes);  //usr routes for user routes 

app.use((err, req, res, next) => {   //this is basically if any error it comes here like if then throw then comes here
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

export default app;
