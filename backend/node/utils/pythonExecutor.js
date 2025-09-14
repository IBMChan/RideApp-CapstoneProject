// backend/node/utils/pythonExecutor.js
import { spawn } from "child_process";
import path from "path";

const PYTHON_BIN = process.env.PYTHON_BIN || "python";
const BASE = process.cwd(); // root is backend/node if you run from there

export async function runPython(scriptRelativePath, args = []) {
  const scriptPath = path.resolve(BASE, scriptRelativePath);
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [scriptPath, ...args]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Python exited ${code}: ${stderr || stdout}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject(new Error("Invalid JSON from python: " + err.message + " ; raw: " + stdout));
      }
    });
  });
}
