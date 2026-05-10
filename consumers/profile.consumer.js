import {
  getChannel
} from "../config/rabbitmq.js";

import User from "../models/User.js";

import cloudinary from "../config/cloudinary.js";


export const startProfileConsumer =
  () => {

    const channel =
      getChannel();

    channel.consume(

      "profileQueue",

      async (msg) => {

        try {

          const data =
            JSON.parse(

              msg.content.toString()
            );

          console.log(
            "Processing Queue:",
            data.userId
          );

          const buffer =
            Buffer.from(

              data.file,

              "base64"
            );

          const result =
            await new Promise(

              (
                resolve,
                reject
              ) => {

                const stream =
                  cloudinary.uploader.upload_stream(

                    {
                      folder:
                        "auth-app",
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

                stream.end(buffer);
              }
            );

          await User.findByIdAndUpdate(

            data.userId,

            {

              profilePic: {

                url:
                  result.secure_url,

                public_id:
                  result.public_id,

              },
            }
          );

          console.log(
            "Profile Uploaded"
          );

          channel.ack(msg);

        } catch (error) {

          console.log(error);
        }
      }
    );
  };