

import Joi from "joi";

export const createIncidentSchema =
  Joi.object({

    title: Joi.string()
      .required(),

    description: Joi.string()
      .required(),

    priority: Joi.string()
      .valid(
        "Low",
        "Medium",
        "High"
      )
      .required(),

    status: Joi.string()
      .valid(
        "Open",
        "In Progress",
        "Resolved"
      )
      .required(),

    latitude: Joi.number()
      .required(),

    longitude: Joi.number()
      .required(),
    address: Joi.string()
      .required(),

  });