import { Button } from "@mui/material";
import Board from "./Board";
import Leaderboard from "./LeaderBoard";
import { getSocket } from "./api/api";

export default function Room() {
 
  return (
    <>
      <Leaderboard />
      <Board />
      <Button onClick={()=>getSocket().emit("start")}>
        Start
      </Button>
    </>
  );
}
