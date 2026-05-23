const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const { createServer, greet } = require("../index");

test("greet returns expected message", () => {
  assert.equal(greet("World"), "Hello, World!");
});

test("GET /api/hello returns hello JSON payload", async () => {
  const server = createServer();
  server.listen(0);
  await once(server, "listening");

  const { port } = server.address();

  await new Promise((resolve, reject) => {
    const req = require("node:http").request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/hello",
        method: "GET",
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            assert.equal(res.statusCode, 200);
            assert.match(res.headers["content-type"], /application\/json/);
            assert.deepEqual(JSON.parse(data), {
              message: "hello from agent swarm",
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on("error", reject);
    req.end();
  });

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});
