import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    required: true,
  },

  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved"],
    default: "Open",
  },

  location: {

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },

  },

  image: {

    url: {
      type: String,
    },

    public_id: {
      type: String,
    },
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
});

const Incident = mongoose.model(
  "Incident",
  incidentSchema
);

export default Incident;