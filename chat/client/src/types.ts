export interface User {
  name: string;
}

export interface MessageAdded {
  userName: string;
  roomName: string;
  message: string;
}
