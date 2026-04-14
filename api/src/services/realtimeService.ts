import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server | null = null;

export type PixelPlacedEvent = {
    gridId: number;
    x: number;
    y: number;
    color: string;
    placedAt: string;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
};

export function initRealtime(server: HttpServer): Server {
    io = new Server(server, {
        cors: {
            origin: "*",
        },
    });

    io.on("connection", (socket) => {
        socket.on("board.join", (boardId: number | string) => {
            const parsedBoardId = Number(boardId);
            if (Number.isInteger(parsedBoardId) && parsedBoardId > 0) {
                socket.join(`board:${parsedBoardId}`);
            }
        });

        socket.on("board.leave", (boardId: number | string) => {
            const parsedBoardId = Number(boardId);
            if (Number.isInteger(parsedBoardId) && parsedBoardId > 0) {
                socket.leave(`board:${parsedBoardId}`);
            }
        });
    });

    return io;
}

export function emitPixelPlaced(event: PixelPlacedEvent): void {
    io?.to(`board:${event.gridId}`).emit("pixel.placed", event);
}

export function emitBoardEnded(boardId: number): void {
    io?.to(`board:${boardId}`).emit("board.ended", { gridId: boardId });
}

