import express from "express";

import {
  createIncident,
  getIncidents,
  getSingleIncident,
  updateIncident,
  deleteIncident,
  updateIncidentStatus,
  getMyIncidents
} from "../controllers/incident.controller.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/Upload.js";

const router = express.Router();

router.post( "/create-incident", protect, upload.single("image"), createIncident );
router.get( "/incidents", getIncidents );
router.get( "/incident/:id", protect, getSingleIncident );
router.patch( "/update-incident/:id", protect, upload.single("image"), updateIncident );
router.delete( "/delete-incident/:id", protect, deleteIncident );
router.put( "/incident/:id/status", protect, adminOnly, updateIncidentStatus );
router.get( "/my-incidents", protect, getMyIncidents );

export default router;