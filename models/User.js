import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
     profilePic: {
    url: String,
    public_id: String
  },
  role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
});

export default  model("User", userSchema)