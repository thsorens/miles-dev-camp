import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

app.get("/", (_req, res) => {
  res.send({ uptime: process.uptime() });
});

interface ConnectedToRoom {
  roomName: string;
}

interface ClientToServerEvents {
  connectedToRoom: (data: ConnectedToRoom) => void;
  disconnectRoom: (data: ConnectedToRoom) => void;
}
interface ServerToClientEvents {
  usersInRoomChanged: (data: number) => void;
}
interface InterServerEvents {}
interface SocketData {}

const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const reportUsersInOneRoom = (roomName: string) => {
  const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
  io.in(roomName).emit("usersInRoomChanged", clientsInRoom?.size ?? 0);
};

io.on("connection", (socket) => {
  socket.on("connectedToRoom", (data) => {
    const room = data.roomName;
    socket.join(room);

    reportUsersInOneRoom(room);
  });

  socket.on("disconnect", () => {
    console.log("disconnected a user");
    const allRooms = io.sockets.adapter.rooms;

    for (let key of allRooms.keys()) {
      if (key.indexOf("test") > -1) {
        reportUsersInOneRoom(key);
      }
    }
  });

  socket.on("disconnectRoom", (data) => {
    console.log("you disconnected" + data.roomName);
    socket.leave(data.roomName);
    // reportUsersInOneRoom(data.roomName);
  });
});

server.listen(4004, () => {
  console.log("Running at localhost:4004");
});
