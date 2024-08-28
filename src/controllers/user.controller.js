import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body
        
    if ([fullname, email, username, password].some((field) =>
        field?.trim() === "")) {
        return res.status(400).json("All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser) {
        return res.status(409).json("User with email or username exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) res.status(400).json("Avatar File is required");
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!avatar) return res.status(400).json("Avatar file is required")
    
    const user = await User.create({
        fullname,
        password,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        res.status(500).json("Something went wrong while registering user")
    }
            
    return res.status(201).json({
        createdUser,
        message: "User registered successfully"
    });
})

export { registerUser }
