import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.js";
import dotenv from "dotenv";
dotenv.config();
import cloudinary from "../config/cloudinary.js";
import { registerSchema, loginSchema } from "../validators/auth.validation.js";

export const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {

      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const { name, email, password } = value;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileData = {};

    if (req.file) {
      const result = await cloudinary.uploader.upload_stream(
        { folder: "auth-app" },
        async (error, result) => {
          if (error) throw error;

          profileData = {
            url: result.secure_url,
            public_id: result.public_id
          };

          const user = await User.create({
            name,
            email,
            password: hashedPassword,
            profilePic: profileData
          });

          return res.json({
            message: "User registered",
            user
          });
        }
      );

      result.end(req.file.buffer);
    } else {
      const user = await User.create({
        name,
        email,
        password: hashedPassword
      });

      res.json({
        message: "User registered without image",
        user
      });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




export const login = async (req, res) => {
  try {

    const { error, value } =
      loginSchema.validate(req.body);

    if (error) {

      return res.status(400).json({
        message:
          error.details[0].message,
      });
    }

    const { email, password } =
      value;

    const attemptsKey =
      `loginAttempts:${email}`;

    const blockKey =
      `loginBlock:${email}`;

    const isBlocked =
      await redisClient.get(blockKey);

    if (isBlocked) {

      const ttl =
        await redisClient.ttl(
          blockKey
        );

      return res.status(403).json({
        message:
          "Too many failed attempts. Try again later.",

        remainingTime: ttl,
      });
    }

    const user =
      await User.findOne({
        email,
      });

    if (!user) {

      const attempts =
        await redisClient.incr(
          attemptsKey
        );

      if (attempts === 1) {

        await redisClient.expire(
          attemptsKey,
          300
        );
      }

      if (attempts >= 3) {

        await redisClient.set(
          blockKey,
          "blocked",
          {
            EX: 300,
          }
        );

        return res.status(403).json({
          message:
            "Too many failed attempts. You are blocked for 5 minutes.",

          remainingTime: 300,
        });
      }

      return res.status(400).json({
        message:
          `Invalid credentials. Attempts left: ${3 - attempts}`,
      });
    }

    const match =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!match) {

      const attempts =
        await redisClient.incr(
          attemptsKey
        );

      if (attempts === 1) {

        await redisClient.expire(
          attemptsKey,
          300
        );
      }

      if (attempts >= 3) {

        await redisClient.set(
          blockKey,
          "blocked",
          {
            EX: 300,
          }
        );

        return res.status(403).json({
          message:
            "Too many failed attempts. You are blocked for 5 minutes.",

          remainingTime: 300,
        });
      }

      return res.status(400).json({
        message:
          `Invalid credentials. Attempts left: ${3 - attempts}`,
      });
    }

    await redisClient.del(
      attemptsKey
    );

    const accessToken =
      jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "15m",
        }
      );

    const refreshToken =
      jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "1h",
        }
      );

    await redisClient.set(
      `refresh:${user._id}`,
      refreshToken,
      {
        EX: 60 * 60,
      }
    );

    res.cookie(
      "accessToken",
      accessToken,
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge:
          15 * 60 * 1000,
      }
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge:
          60 * 60 * 1000,
      }
    );

    res.json({
      message: "Login success",
      user,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};


export const refreshTokenHandler = async (req, res) => {
  const token = req.cookie.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "NO Token" })
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const storedToken = await redisClient.get(`refresh:${decode.id}`);
    if (!storedToken || storedToken !== token) {
      return res.status(403).json("Invalid token")
    }
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000
    })
  } catch (err) {
    console.log(err);
    res.status(403).json({ message: "Invalid token" })
  }
}


export const logout = async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.refreshToken = null;
    await user.save();

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logout successful" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Logout error" });
  }
};



export const profile = async (req, res) => {
  res.json({
    message: "Profile open sucessfully",
    user: req.user
  })
}


export const updateUser = async (req, res) => {

  try {

    const userId = req.user.id;

    const { name } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name) {
      user.name = name;
    }

    if (req.file) {

      const uploadImage = await cloudinary.uploader.upload(
        req.file.path
      );

      user.profilePic = {
        url: uploadImage.secure_url,
        public_id: uploadImage.public_id,
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User Updated Successfully",
      user,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });

  }
};


export const deleteUser = async (req, res) => {

  try {

    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.profilePic?.public_id) {

      await cloudinary.uploader.destroy(
        user.profilePic.public_id
      );
    }

    await User.findByIdAndDelete(userId);

    res.clearCookie("accessToken");

    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });

  }
};


export const getMe = async (req, res) => {

  try {

    const user =
      await User.findById(
        req.user.id
      ).select("-password");

    if (!user) {

      return res.status(404).json({
        message:
          "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

