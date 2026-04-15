import {io, type Socket} from "socket.io-client";
import {API_URL} from "../config";

const socketBaseUrl = API_URL.replace(/\/api\/?$/, "");

// Extract path prefix for Socket.IO (e.g. "/pixel-war/socket.io")
const url = new URL(socketBaseUrl);
const socketPath = `${url.pathname.replace(/\/+$/, "")}/socket.io`;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(socketBaseUrl, {
      path: socketPath,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
}

export function joinBoard(boardId: number): void {
  getSocket().emit("board.join", boardId);
}

export function leaveBoard(boardId: number): void {
  getSocket().emit("board.leave", boardId);
}

