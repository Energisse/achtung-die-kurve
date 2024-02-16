import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Socket, io } from 'socket.io-client';

let socket:Socket|null  = null;
export const getSocket = () => {
  if(socket) return socket;
  socket = io("http://localhost:5000");
  socket.on('connect', () => {
  });
  return socket;
}

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (build) => ({
    getServers: build.query<Array<{
      maxPlayers:number,
      players:number,
      created:string,
      id:string
    }>, void>({
      queryFn: () => ({ data: []}),
      async onCacheEntryAdded(_,
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
      ) {
        try {
          await cacheDataLoaded;
          
          const socket = getSocket();

          socket.emit('servers',(servers:any)=>{
            updateCachedData(()=>servers);
          })
          
          await cacheEntryRemoved;
     
          socket.off('connect');
        
        } catch(e) {
          console.log(e);
        }
      }
    }),

    getRoomInfos: build.query<number, void>({
      queryFn: () => ({ data: 0}),
      async onCacheEntryAdded(_,
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
      ) {
        try {
          await cacheDataLoaded;
          
          const socket = getSocket();
          
          socket.emit('room',(players:number)=>{
            updateCachedData(()=>players);
          })

          socket.on('room',(players:number)=>{
            updateCachedData(()=>players);
          })
          
          await cacheEntryRemoved;
     
          socket.off('room');
        
        } catch(e) {
          console.log(e);
        }
      }
    }),

    joinServer: build.mutation<void, string>({
      queryFn: async (id) => new Promise((resolve,reject) => {
        const socket = getSocket();
        socket.emit('join', id,(done:boolean)=>{
          if(done) return resolve({data:undefined});
          return reject({data:undefined});
        });
      })
    }),
  }),
})

export const {useGetServersQuery,useJoinServerMutation,useGetRoomInfosQuery} = api

export default api;