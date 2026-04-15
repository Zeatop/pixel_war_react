import {io, type Socket} from "socket.io-client";
import {API_URL} from "../config";

const socketBaseUrl = API_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(socketBaseUrl, {
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

