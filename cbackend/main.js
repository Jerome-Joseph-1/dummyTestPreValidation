require("dotenv").config();
const fastify = require("fastify")({ logger: true });
const PORT = process.env.PORT || 3001;
const axios = require("axios");

// Object storing dummy data for various session IDs
const sessionsData = {
  session1: {
    users: [
      {
        email: "user1@example.com",
        documents: ["user1_doc1.pdf", "user1_doc2.pdf"],
        screenshots: ["user1_screen1.png", "user1_screen2.png"],
        instructions: "Follow user 1 steps.",
      },
    ],
    callbackSystem: {
      dataCallbackUrl: `http://localhost:3002/api/receiveData`,
      dataCallbackParameters: {
        param1: "user1_value1",
        param2: "user1_value2",
      },
    },
  },
  session2: {
    users: [
      {
        email: "user2@example.com",
        documents: ["user2_doc1.pdf", "user2_doc2.pdf"],
        screenshots: ["user2_screen1.png", "user2_screen2.png"],
        instructions: "Follow user 2 steps.",
      },
    ],
    callbackSystem: {
      dataCallbackUrl: `http://localhost:3002/api/receiveData`,
      dataCallbackParameters: {
        param1: "user2_value1",
        param2: "user2_value2",
      },
    },
  },
  session3: {
    users: [
      {
        email: "user3@example.com",
        documents: ["user3_doc1.pdf", "user3_doc2.pdf"],
        screenshots: ["user3_screen1.png", "user3_screen2.png"],
        instructions: "Follow user 3 steps.",
      },
    ],
    callbackSystem: {
      dataCallbackUrl: `http://localhost:3002/api/receiveData`,
      dataCallbackParameters: {
        param1: "user3_value1",
        param2: "user3_value2",
      },
    },
  },
  session4: {
    users: [
      {
        email: "user4@example.com",
        documents: ["user4_doc1.pdf", "user4_doc2.pdf"],
        screenshots: ["user4_screen1.png", "user4_screen2.png"],
        instructions: "Follow user 4 steps.",
      },
    ],
    callbackSystem: {
      dataCallbackUrl: `http://localhost:3002/api/receiveData`,
      dataCallbackParameters: {
        param1: "user4_value1",
        param2: "user4_value2",
      },
    },
  },
  session5: {
    users: [
      {
        email: "user5@example.com",
        documents: ["user5_doc1.pdf", "user5_doc2.pdf"],
        screenshots: ["user5_screen1.png", "user5_screen2.png"],
        instructions: "Follow user 5 steps.",
      },
    ],
    callbackSystem: {
      dataCallbackUrl: `http://localhost:3002/api/receiveData`,
      dataCallbackParameters: {
        param1: "user5_value1",
        param2: "user5_value2",
      },
    },
  },
};

async function basicAuth(request, reply) {
    console.log(request.headers)
  const authorization = request.headers.authorization;
  if (!authorization) {
    reply.status(401).send({ error: "No authorization header provided" });
    return reply;
  }
  console.log(authorization)
  const [scheme, encoded] = authorization.split(" ");
  if (scheme !== "Basic" || !encoded) {
    reply.status(401).send({ error: "Malformed authorization header" });
    return reply;
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  console.log(decoded)
  const [username, password] = decoded.split(":");

  console.log(username, password)
  if (
    username !== process.env.BASIC_AUTH_USER ||
    password !== process.env.BASIC_AUTH_PASS
  ) {
    console.log(username, password);
    reply.status(401).send({ error: "Invalid username or password" });
    return reply;
  }
}

// Function to fetch and send session data
async function postMissingDataCallbackV2(sessionId, domain) {
  try {
    // basically the fetch to the db
    let sessionData = sessionsData[sessionId];

    sessionData.email = sessionData.users[0].email;
    sessionData.documents = sessionData.users[0].documents;
    sessionData.screenshots = sessionData.users[0].screenshots;
    sessionData.instructions = sessionData.users[0].instructions;

    const postResp = await axios.post(
      sessionData.callbackSystem.dataCallbackUrl,
      {
        callbackParameters: sessionData.callbackSystem.dataCallbackParameters,
        data: sessionData,
      }
    );

    return { status: postResp.status, data: postResp.data };
  } catch (error) {
    return { error: error.message };
  }
}

// API endpoint to handle session IDs
fastify.post(
  "/api/pushData",
  { preValidation: [basicAuth] },
  async (request, reply) => {
    const { sessionIds, domain } = request.body;

    if (
      !Array.isArray(sessionIds) ||
      sessionIds.some((id) => typeof id !== "string")
    ) {
      return reply
        .status(400)
        .send({ error: "Invalid session IDs, must be an array of strings." });
    }

    const results = await Promise.all(
      sessionIds.map((sessionId) =>
        postMissingDataCallbackV2(sessionId, domain)
          .then((response) => ({ sessionId, response }))
          .catch((error) => ({ sessionId, error: error.message }))
      )
    );

    const responseMap = results.reduce((acc, { sessionId, response }) => {
      acc[sessionId] = response;
      return acc;
    }, {});

    return reply.send(responseMap);
  }
);

fastify.get("/api/health", async (request, reply) => {
  return { status: "ok", message: "Server is running and reachable" };
});

fastify.listen(PORT, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  const address = `http://${fastify.server.address().address}:${
    fastify.server.address().port
  }`;
  fastify.log.info(`Server listening on ${address}`);
});
