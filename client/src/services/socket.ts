import {io, type Socket} from "socket.io-client";
import {API_URL} from "../config";

const socketBaseUrl = API_URL.replace(/\/api\/?$/, "");

// In production behind a reverse proxy (e.g. /pixel-war), the URL path
// is interpreted by Socket.IO as a namespace. We must connect to the origin
// and set the path prefix explicitly so Traefik routes it correctly.
const url = new URL(socketBaseUrl);
const socketPath = `${url.pathname.replace(/\/+$/, "")}/socket.io`;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(url.origin, {
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

