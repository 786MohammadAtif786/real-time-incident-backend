import Incident from "../models/Incident.js";
import cloudinary from "../config/cloudinary.js";
import { io } from "../app.js";

import { createIncidentSchema } from "../validators/incident.validation.js";

export const createIncident = async (req, res) => {

  try {

    const { error, value } =

      createIncidentSchema.validate(
        req.body
      );

    if (error) {

      return res.status(400).json({

        message:
          error.details[0].message,

      });
    }

    const {
      title,
      description,
      priority,
      status,
      latitude,
      longitude,
      address
    } = value;

    let imageData = {};


    if (req.file) {

      const result =

        await cloudinary.uploader.upload_stream(
          {

            folder: "incidents",

          },

          async (error, result) => {

            if (error) {

              throw error;

            }

            imageData = {

              url:
                result.secure_url,

              public_id:
                result.public_id,

            };

            const incident =

              await Incident.create({

                title,

                description,

                priority,

                status,

                location: {

                  latitude,

                  longitude,

                  address,

                },

                image: imageData,

                createdBy:
                  req.user.id,

              });

            const populatedIncident =
              await Incident.findById(
                incident._id
              ).populate(
                "createdBy",
                "name email profilePic"
              );
            io.emit(
              "newIncident",

              populatedIncident

            );

            return res.status(201).json({

              success: true,

              message:
                "Incident Created Successfully",

              incident: populatedIncident

            });

          }
        );

      result.end(req.file.buffer);

    } else {


      const incident =

        await Incident.create({

          title,

          description,

          priority,

          status,

          location: {

            latitude,

            longitude,

            address,

          },

          createdBy:
            req.user.id,

        });

      io.emit(

        "newIncident",

        incident

      );

      return res.status(201).json({

        success: true,

        message:
          "Incident Created Successfully",

        incident,

      });

    }

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      message: error.message,

    });

  }
};



export const getIncidents = async (req, res) => {

  try {

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 5;

    const search =
      req.query.search || "";

    const priority =
      req.query.priority || "";

    const status =
      req.query.status || "";

    const sort =
      req.query.sort || "newest";

    const skip =
      (page - 1) * limit;

    const filter = {};

    if (search) {

      filter.$or = [

        {
          title: {
            $regex: search,
            $options: "i",
          },
        },

        {
          description: {
            $regex: search,
            $options: "i",
          },
        },

      ];
    }

    if (priority) {

      filter.priority =
        priority;
    }

    if (status) {

      filter.status = status;
    }

    let sortOption = {};

    if (sort === "newest") {

      sortOption = {
        createdAt: -1,
      };

    } else if (
      sort === "oldest"
    ) {

      sortOption = {
        createdAt: 1,
      };

    } else if (
      sort === "priority"
    ) {

      sortOption = {
        priority: 1,
      };
    }

    const totalIncidents =
      await Incident.countDocuments(
        filter
      );

    const incidents =
      await Incident.find(filter)
        .populate(
          "createdBy",
          "name email profilePic"
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

    const totalPages =
      Math.ceil(
        totalIncidents / limit
      );

    return res.status(200).json({
      success: true,

      currentPage: page,

      totalPages,

      totalIncidents,

      incidents,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message,
    });
  }
};




export const getSingleIncident =
  async (req, res) => {

    try {

      const incident =
        await Incident.findById(
          req.params.id
        );

      if (!incident) {

        return res.status(404).json({
          message:
            "Incident not found",
        });
      }

      if (

        incident.createdBy.toString() !==
        req.user._id.toString()

      ) {

        return res.status(403).json({
          message:
            "Unauthorized Access",
        });
      }

      await incident.populate(
        "createdBy",
        "name email profilePic"
      );

      return res.status(200).json({
        success: true,
        incident,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        message:
          error.message,
      });
    }
  };


export const updateIncident = async (req, res ) => {

  try {

    const incident =

      await Incident.findById(
        req.params.id
      );

    if (!incident) {

      return res.status(404).json({

        message:
          "Incident not found",

      });
    }

    // ONLY OWNER UPDATE
    if (

      incident.createdBy.toString()

      !==

      req.user.id

    ) {

      return res.status(403).json({

        message:
          "Unauthorized",

      });
    }

    const {

      title,

      description,

      priority,

      status,

      latitude,

      longitude,

      address,

    } = req.body;



    if (req.file) {

      if (
        incident.image?.public_id
      ) {

        await cloudinary.uploader.destroy(

          incident.image.public_id

        );
      }

      const result =

        await new Promise(

          (resolve, reject) => {

            const stream =

              cloudinary.uploader.upload_stream(

                {
                  folder:
                    "incidents",
                },

                (
                  error,
                  result
                ) => {

                  if (error) {

                    reject(error);

                  } else {

                    resolve(result);

                  }
                }
              );

            stream.end(
              req.file.buffer
            );
          }
        );

      incident.image = {

        url:
          result.secure_url,

        public_id:
          result.public_id,

      };
    }


    if (title) {

      incident.title = title;

    }

    if (description) {

      incident.description =
        description;

    }

    if (priority) {

      incident.priority =
        priority;

    }

    if (status) {

      incident.status =
        status;

    }

    if (
      latitude &&
      longitude
    ) {

      incident.location = {

        latitude,

        longitude,

        address,

      };
    }

    await incident.save();

    io.emit(

      "incidentUpdated",

      incident

    );

    return res.status(200).json({

      success: true,

      message:
        "Incident Updated Successfully",

      incident,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      message:
        error.message,

    });
  }
};



export const deleteIncident = async (req, res) => {

  try {

    const incident =
      await Incident.findById(
        req.params.id
      );

    if (!incident) {

      return res.status(404).json({
        message: "Incident not found",
      });
    }

    if (
      incident.createdBy.toString() !==
      req.user.id
    ) {

      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (
      incident.image?.public_id
    ) {

      await cloudinary.uploader.destroy(
        incident.image.public_id
      );
    }

    await Incident.findByIdAndDelete(
      req.params.id
    );

    io.emit(
      "incidentDeleted",
      req.params.id
    );


    return res.status(200).json({
      success: true,
      message:
        "Incident Deleted Successfully",
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message,
    });
  }
};


export const updateIncidentStatus =
  async (req, res) => {

    try {

      const { id } = req.params;

      const { status } = req.body;

      const incident =
        await Incident.findById(id);

      if (!incident) {

        return res.status(404).json({

          message:
            "Incident not found",

        });
      }

      incident.status = status;

      await incident.save();

      res.status(200).json({

        success: true,

        message:
          "Status Updated",

        incident,

      });

    } catch (error) {

      res.status(500).json({

        message: error.message,

      });

    }
  };


export const getMyIncidents =
  async (req, res) => {

    try {

      const incidents =
        await Incident.find({

          createdBy:
            req.user.id,

        })

          .populate(
            "createdBy",
            "name email"
          )

          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        incidents,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        message:
          error.message,
      });
    }
  };