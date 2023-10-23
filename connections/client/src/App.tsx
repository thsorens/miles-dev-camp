import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import io, { Socket } from "socket.io-client";

import "./App.css";

const url = "http://localhost:4004";

function App() {
  const [count, setCount] = useState(0);
  const roomName = "test";
  useEffect(() => {
    const ioConn: Socket = io(url);

    ioConn.on("connect", () => {
      ioConn.emit("connectedToRoom", {
        roomName: roomName,
      });
    });

    ioConn.on("usersInRoomChanged", (amountOfUsers) => {
      console.log("users on room changed");
      setCount(amountOfUsers);
    });

    return () => {
      ioConn.emit("disconnectRoom", { roomName: roomName });
      ioConn.close();
    };
  }, []);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">Connected users is {count}</div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
