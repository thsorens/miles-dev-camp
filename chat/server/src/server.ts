import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

app.get("/", (_req, res) => {
  res.send({ uptime: process.uptime() });
});

interface ConnectedToRoom {
  roomName: string;
  userName: string;
}

interface MessageAdded {
  userName: string;
  roomName: string;
  message: string;
}

interface ClientToServerEvents {
  connectedToRoom: (data: ConnectedToRoom) => void;
  disconnectRoom: (data: ConnectedToRoom) => void;
  addMessage: (data: MessageAdded) => void;
}
interface ServerToClientEvents {
  usersInRoomChanged: (data: number) => void;
  userJoinedOurRoom: (name: string, allUsers: User[]) => void;
  newMessageAdded: (data: MessageAdded) => void;
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

interface User {
  name: string;
}

const users: Record<string, User> = {};

const reportUsersInOneRoom = (roomName: string) => {
  const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
  io.in(roomName).emit("usersInRoomChanged", clientsInRoom?.size ?? 0);
};

const reportNewUserJoined = (roomName: string, userName: string) => {
  const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
  const allUsers = Array.from(clientsInRoom!.values()).map(
    (key): User => users[key]
  );

  console.log(allUsers);
  io.in(roomName).emit("userJoinedOurRoom", userName, allUsers);
};

const reportNewMessageAdded = (messageAdded: MessageAdded) => {
  io.in(messageAdded.roomName).emit("newMessageAdded", messageAdded);
};

io.on("connection", (socket) => {
  socket.on("connectedToRoom", (data) => {
    const room = data.roomName;
    socket.join(room);
    reportUsersInOneRoom(room);
    users[socket.id] = { name: data.userName };
    reportNewUserJoined(room, data.userName);
  });

  socket.on("addMessage", (data) => {
    reportNewMessageAdded(data);
  });

  socket.on("disconnect", () => {
    console.log("disconnected a user");
    const allRooms = io.sockets.adapter.rooms;

    for (let key of allRooms.keys()) {
      if (key.indexOf("test") > -1) {
        reportUsersInOneRoom(key);
        reportNewUserJoined(key, "");
      }
    }
  });

  socket.on("disconnectRoom", (data) => {
    console.log("you disconnected" + data.roomName);
    socket.leave(data.roomName);
  });
});

server.listen(4004, () => {
  console.log("Running at localhost:4004");
});
