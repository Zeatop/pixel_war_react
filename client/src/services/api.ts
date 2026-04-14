import axios from "axios";
import {API_URL} from "../config";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export type Board = {
  id: number;
  name: string | null;
  width: number;
  height: number;
  createdAt: string;
  endsAt: string | null;
  status: "in_progress" | "finished";
  allowOverwrite: boolean;
  cooldownSeconds: number;
  authorId: number | null;
};

export type Frame = {
  id: number;
  gridId: number;
  x: number;
  y: number;
  color: string;
  createdAt: string;
};

export type PlacePixelPayload = {
  x: number;
  y: number;
  color: string;
};

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

// Intercepteur : attache le JWT a chaque requete
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pixelwar-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur reponse : redirige vers login si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pixelwar-token");
      localStorage.removeItem("pixelwar-user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

export async function fetchBoardState(boardId: number): Promise<{ grid: Board; frames: Frame[] }> {
  const { data } = await api.get(`/boards/${boardId}/state`);
  return data;
}

export async function fetchBoards(status?: "in_progress" | "finished"): Promise<Board[]> {
  const { data } = await api.get("/boards", { params: status ? { status } : undefined });
  return data.boards as Board[];
}

export async function placePixel(boardId: number, payload: PlacePixelPayload): Promise<PixelPlacedEvent> {
  const { data } = await api.post(`/boards/${boardId}/pixels`, payload);
  return data;
}
