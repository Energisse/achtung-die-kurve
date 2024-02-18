import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Socket, io } from 'socket.io-client';

let socket: Socket | null = null;
export const getSocket = () => {
  if (socket) return socket;
  socket = io("http://localhost:5000");
  socket.on('connect', () => {
  });
  return socket;
}

export type RoomInfo = {
  players: Array<{
    name: string,
    isModerator: boolean,
    id: string,
    color: string,
  }>
}

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (build) => ({
    getServers: build.query<Array<{
      maxPlayers: number,
      players: number,
      created: string,
      id: string
    }>, void>({
      queryFn: () => ({ data: [] }),
      async onCacheEntryAdded(_,
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
      ) {
        try {
          await cacheDataLoaded;

          const socket = getSocket();

          socket.emit('servers', (servers: any) => {
            updateCachedData(() => servers);
          })

          await cacheEntryRemoved;

          socket.off('connect');

        } catch (e) {
          console.log(e);
        }
      }
    }),

    getRoomInfos: build.query<RoomInfo | null, void>({
      queryFn: () => ({ data: null }),
      async onCacheEntryAdded(_,
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
      ) {
        try {
          await cacheDataLoaded;

          const socket = getSocket();

          socket.emit('room', (room: RoomInfo) => {
            updateCachedData(() => room);
          })

          socket.on('room', (room: RoomInfo) => {
            updateCachedData(() => room);
          })

          await cacheEntryRemoved;

          socket.off('room');

        } catch (e) {
          console.log(e);
        }
      }
    }),

    joinServer: build.mutation<void, { serverId: string, username: string }>({
      queryFn: async ({ serverId, username }) => new Promise((resolve, reject) => {
        const socket = getSocket();
        socket.emit('join', serverId, username, (done: boolean) => {
          if (done) return resolve({ data: undefined });
          return reject({ data: undefined });
        });
      })
    }),
    createServer: build.mutation<void, string>({
      queryFn: async (username) => new Promise((resolve, reject) => {
        const socket = getSocket();
        socket.emit('create', username, (done: boolean) => {
          if (done) return resolve({ data: undefined });
          return reject({ data: undefined });
        });
      })
    }),
    setDirection: build.mutation<void, "left" | "right" | "forward">({
      queryFn: async (message) => {
        const socket = getSocket();
        socket.emit('direction', message);
        return { data: undefined }
      },
    }),
    getBoard: build.query<Array<Array<[number, number]>>, void>({
      queryFn: () => ({ data: [] }),
      async onCacheEntryAdded(
        photoId,
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
      ) {
        try {
          await cacheDataLoaded;

          const socket = getSocket();

          socket.on('connect', () => {
          });

          socket.on('tick', (data: Array<[number, number]>) => {
            updateCachedData((draft) => {
              data.forEach((d, index) => {
                if (!draft[index]) {
                  draft[index] = [];
                }
                draft[index].push(d);
              })
            });
          })
          await cacheEntryRemoved;

          socket.off('connect');
        } catch {
          // if cacheEntryRemoved resolved before cacheDataLoaded,
          // cacheDataLoaded throws
        }
      },
    }),
  })
})

export const { useGetServersQuery, useJoinServerMutation, useGetRoomInfosQuery, useCreateServerMutation, useSetDirectionMutation, useGetBoardQuery } = api

export default api;