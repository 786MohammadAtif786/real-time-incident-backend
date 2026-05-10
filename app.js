
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import incidentRoutes from "./routes/incident.routes.js";
import cookieParser from "cookie-parser";
import { redisClient } from "./config/redis.js";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectRabbitMQ } from "./config/rabbitmq.js";
// import "./consumers/profile.consumer.js";
import {
  startProfileConsumer
}
from "./consumers/profile.consumer.js";


dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());


//    "http://localhost:5173",

// app.use(cors({

//   origin:
//   process.env.CLIENT_URL,
//   credentials: true

// }));

app.use(cors({

    origin: function (
      origin,
      callback
    ) {

      const allowedOrigins = [

        "http://localhost:5173",

        "https://real-time-incident-frontend.vercel.app"

      ];

      if (!origin)
        return callback(
          null,
          true
        );

      const cleanOrigin =
        origin.replace(/\/$/, "");

      if (
        allowedOrigins.includes(
          cleanOrigin
        )
      ) {

        callback(null, true);

      } else {

        console.log(
          "❌ Blocked origin:",
          origin
        );

        callback(null, false);
      }
    },

    credentials: true,

  })

);



connectDB();

redisClient;
await connectRabbitMQ();
startProfileConsumer();

app.use(
  "/api/v1",
  authRoutes
);

app.use(
  "/api/v1",
  incidentRoutes
);

app.get('/', (req, res) => {

  res.json({
    Api: "Real Time Incidents"
  });

});


const server =
  http.createServer(app);


export const io =
  new Server(server, {

    cors: {

      origin:
        process.env.CLIENT_URL,
      credentials: true,

    },

});


io.on(
  "connection",

  (socket) => {

    console.log(
      "User Connected:",
      socket.id
    );

    socket.on(
      "disconnect",

      () => {

        console.log(
          "User Disconnected"
        );

      }
    );
});

const PORT =
  process.env.PORT;


server.listen(PORT, () => {

  console.log(
    `Server is listen ${PORT}`
  );

});