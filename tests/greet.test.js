const { greet, parseArgs, getUsage, runCli } = require("../index");

describe("greet", () => {
  test("returns greeting for provided name", () => {
    expect(greet("Alice")).toBe("Hello, Alice!");
  });
});

describe("parseArgs", () => {
  test("parses --name=<value>", () => {
    expect(parseArgs(["--name=Bob"])).toEqual({ help: false, name: "Bob" });
  });

  test("parses --help", () => {
    expect(parseArgs(["--help"])).toEqual({ help: true, name: "World" });
  });
});

describe("runCli", () => {
  test("prints usage for --help", () => {
    const output = [];
    runCli(["--help"], (message) => output.push(message));
    expect(output[0]).toBe(getUsage());
  });

  test("prints greeting for custom name", () => {
    const output = [];
    runCli(["--name=Charlie"], (message) => output.push(message));
    expect(output[0]).toBe("Hello, Charlie!");
  });
});
