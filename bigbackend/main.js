require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const PORT = process.env.PORT || 3002;

fastify.post('/api/receiveData', async (request, reply) => {
    console.log(request.body) // consider limiting what is logged
    return { message: `Data received successfully : ${request.body.data.instructions}`, status: 200 };
});

fastify.listen(PORT, (err) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    const address = `http://${fastify.server.address().address}:${fastify.server.address().port}`;
    fastify.log.info(`Server listening on ${address}`);
  });
