import amqp from "amqplib";

let channel;

const connectRabbitMQ =
  async () => {

    try {

      const connection =
        await amqp.connect(

          process.env
            .RABBITMQ_URL
        );

      channel =
        await connection.createChannel();

      await channel.assertQueue(
        "profileQueue"
      );

      console.log(
        "RabbitMQ Connected"
      );

    } catch (error) {

      console.log(error);

    }
};

const getChannel = () => {

  if (!channel) {

    throw new Error(
      "RabbitMQ channel not initialized"
    );
  }

  return channel;
};

export {

  connectRabbitMQ,

  getChannel,

};