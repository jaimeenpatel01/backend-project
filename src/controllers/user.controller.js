import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken; //storing in browser
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    res.status(500).json("something went wrong while generating access token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    return res.status(400).json("All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    return res.status(409).json("User with email or username exists");
  }

  // console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) res.status(400).json("Avatar File is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) return res.status(400).json("Avatar file is required");

  const user = await User.create({
    fullname,
    password,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    res.status(500).json("Something went wrong while registering user");
  }

  return res.status(201).json({
    createdUser,
    message: "User registered successfully",
  });
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;
    if (!(email || username)) {
        res.status(400).json("Username or Email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) res.status(404).json("User does not exist");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) res.status(401).json("Invalid Password");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        //sending cookies
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json("user logged in successfully");
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json("User logged out");
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        res.status(401).json("Unauthorized request");
    }

   try {
     const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);
 
     const user = await User.findById(decodedToken?._id);
 
     if (!user) {
         res.status(401).json("Invalid Access Token")
     }
     
     //validate refresh token from user and database
     if (incomingRefreshToken !== user?.refreshToken) {
         res.status(401).json("Refresh token is expired or used")
     }
 
     const options = {
         httpOnly: true,
         secure:true
     }
 
     const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
 
     return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", refreshToken, options)
         .json("Access token refreshed")
   } catch (error) {
       return res.status(401).json("Invalid refresh token", error);
   }
    
})

export { registerUser, loginUser, logoutUser, refreshAccessToken };
