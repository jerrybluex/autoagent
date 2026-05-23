// Agent Swarm Test - Entry Point

const http = require("node:http");

function greet(name) {
  return `Hello, ${name}!`;
}

function requestHandler(req, res) {
  if (req.method === "GET" && req.url === "/api/hello") {
    const body = JSON.stringify({ message: "hello from agent swarm" });
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
}

function createServer() {
  return http.createServer(requestHandler);
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

module.exports = { greet, requestHandler, createServer };
