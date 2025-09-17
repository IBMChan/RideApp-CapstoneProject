// backend/node/utils/socket.js
import { Server } from "socket.io";
import appEvents from "./events.js";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost", // adjust for your frontend URL
      methods: ["GET", "POST", "PUT", "PATCH"]
    }
  });

  io.on("connection", (socket) => {
    console.log("New socket connected", socket.id);

    // Rider identifies itself by riderId
    const { riderId } = socket.handshake.query;
    if (riderId) {
      console.log(`Socket ${socket.id} listening for rider ${riderId}`);

      const listener = (data) => {
        // Emit a generic 'ride:update' event for the frontend
        socket.emit("ride:update", data);
      };

      // Listen to all ride status updates for this rider
      appEvents.on(`rideStatusUpdate:${riderId}`, listener);

      socket.on("disconnect", () => {
        appEvents.removeListener(`rideStatusUpdate:${riderId}`, listener);
      });
    }
  });
}

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
