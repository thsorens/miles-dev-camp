import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

import "./App.css";
import { MessageAdded, User } from "./types";
import { toast } from "react-toastify";

const url = "http://localhost:4004";

function App() {
  const [userName, setUsername] = useState("");
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<MessageAdded[]>([]);
  const [message, setMessage] = useState("");
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const mySocket = useRef<Socket>();

  useEffect(() => {
    mySocket.current = io(url);
    const ioConn = mySocket.current!;

    ioConn.on("connect", () => {
      ioConn.on("userJoinedOurRoom", (joinedUser: string, users: User[]) => {
        if (joinedUser !== userName) {
          toast.info(`${joinedUser} just joined us`);
        } else {
          toast.info(`Welcome ${joinedUser}`);
        }
        setConnectedUsers(users);
      });

      ioConn.on("newMessageAdded", (messageAdded) => {
        setMessages((prev) => [...prev, messageAdded]);
      });
    });

    return () => {
      mySocket.current!.emit("disconnectRoom", { roomName: "test" });
      mySocket.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startChat = () => {
    const ioConn = mySocket.current!;
    setConnected(true);
    ioConn.emit("connectedToRoom", { roomName: "test", userName });
  };

  const submitMessage = () => {
    const ioConn = mySocket.current!;
    ioConn.emit("addMessage", { userName, roomName: "test", message });
    setMessage("");
  };

  return (
    <>
      {!connected ? (
        <div className="card">
          Username
          <input
            type="text"
            value={userName}
            onChange={(ev) => setUsername(ev.target.value)}
          />
          <button onClick={startChat}>Start chat</button>
        </div>
      ) : (
        <div className="card">
          Connected
          <div>
            Connected users:
            {connectedUsers.map((user) => (
              <div key={user.name}>{user.name}</div>
            ))}
            <h3>Messages</h3>
            <div>
              {messages.map((message, idx) => (
                <div key={idx}>
                  {message.userName} : {message.message}
                </div>
              ))}
              <input
                type="text"
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
              />
              <button onClick={submitMessage}>Submit message</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
