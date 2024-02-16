import { useGetRoomInfosQuery } from "./api/api";

export default function Room() {

    const { data:userCount } = useGetRoomInfosQuery();

    return  <>
        {userCount}
    </>
}