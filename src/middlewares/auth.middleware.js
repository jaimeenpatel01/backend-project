import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
  
    if (!token) {
      return res.status(401).json("Unauthorized request");
    }
  
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
    const user = User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
  
    if (!user) {
      return res.status(401).json("Invalid access token");
      }
      
      req.user = user;
      next();
  } catch (error) {
      res.status(401).json(error?.message || "Invalid access token");
  }
});
