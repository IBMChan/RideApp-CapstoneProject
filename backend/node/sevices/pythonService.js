import { spawn } from "child_process";
import path from "path";

// Absolute path
const scriptPath = path.resolve("./python/rides/rideUtils.py");

export function callPython(method, params) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", [scriptPath, method, JSON.stringify(params)]);

    let output = "";
    let error = "";

    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => (error += data.toString()));

    py.on("close", (code) => {
      if (code !== 0) return reject(new Error(error));
      try {
        resolve(JSON.parse(output));
      } catch (e) {
        reject(new Error("Invalid Python output: " + output));
      }
    });
  });
}
