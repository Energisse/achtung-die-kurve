import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Socket, io } from 'socket.io-client';

let socket: Socket | null = null;
export const getSocket = () => {
  if (socket) return socket;
  socket = io(process.env.REACT_APP_SERVER_URI, { transports: ['websocket'] });
  socket.on('connect', () => {
  });
  return socket;
}

export type Leaderboard = Array<{
  name: string,
  isModerator: boolean,
  id: string,
  color: string,
  isALive: boolean,
  points: number
}>

export type Line = {
  p1: Dot,
  p2: Dot,
  width: number,
}


export type Dot = {
  x: number,
  y: number,
}

export type Circle = Dot & {
  radius: number,
}

export type RoomInfo = {
  leaderboard: Leaderboard,
  moderator: boolean
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

    getRoomInfos: build.query<RoomInfo, void>({
      queryFn: () => ({
        data: {
          leaderboard: [],
          moderator: false,
        }
      }),
      async onCacheEntryAdded(_,
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
      ) {
        await cacheDataLoaded;

        const socket = getSocket();


        socket.on('leaderboard', (leaderboard: Leaderboard) => {
          updateCachedData((room) => ({ ...room, leaderboard, moderator: leaderboard.find(p => p.id === socket?.id)?.isModerator || false }));
        })

        socket.on('kicked', () => {
          updateCachedData(() => ({ leaderboard: [], moderator: false}));
        })

        socket.on('start', () => {
          updateCachedData((room) => {
            return room;
          });
        })

        await cacheEntryRemoved;

        socket.off('room');
        socket.off('kicked');
        socket.off('start');
        socket.off('leaderboard');
      }
    }),
    isPaused: build.query<boolean, void>({
      queryFn: () => ({
        data: false
      }),
      async onCacheEntryAdded(_,
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
      ) {
        await cacheDataLoaded;
        const socket = getSocket();

        socket.on('resumed', () => updateCachedData(() => false));

        socket.on('paused', () => updateCachedData(() => true));

        await cacheEntryRemoved;

        socket.off('resumed');
        socket.off('paused');
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
    kick: build.mutation<void, string>({
      queryFn: async (id) => {
        const socket = getSocket();
        socket.emit('kick', id);
        return { data: undefined }
      },
    }),
  })
})

export const { useGetServersQuery, useJoinServerMutation, useGetRoomInfosQuery, useCreateServerMutation, useSetDirectionMutation, useKickMutation,useIsPausedQuery } = api

export default api;