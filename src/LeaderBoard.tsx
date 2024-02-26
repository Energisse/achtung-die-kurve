import { faCrown, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Grid, Typography, useTheme } from "@mui/material";
import {
  useGetRoomInfosQuery, useKickMutation
} from "./api/api";

export default function Leaderboard() {
  const { data: room } = useGetRoomInfosQuery();
  const [kick] = useKickMutation();
  const theme = useTheme();

  function kickHandle(userId: string) {
    kick(userId);
  }

  return (
      <Grid
        item
        container
        flexDirection={"row"}
        flexBasis={"content"}
        margin={"auto"}
        justifyContent={"center"}
        justifyItems={"center"}
        sx={{
          background: theme.palette.dark200,
          color: "white",
        }}
      >
        {room?.leaderboard.map(
          ({ name, isModerator, id, color, points }) => (
            <Grid item container xs={12} p={1} key={id}>
              <Grid item>
                <Typography
                  key={id}
                  sx={{ color }}
                  variant="body1"
                  display={"inline-block"}
                >
                  {points}
                </Typography>
                <FontAwesomeIcon
                  icon={faCrown}
                  style={{ visibility: isModerator ? "visible" : "hidden" }}
                />
                <Typography
                  key={id}
                  sx={{ color }}
                  variant="body1"
                  display={"inline-block"}
                >
                  {name}
                </Typography>
                <FontAwesomeIcon 
                  onClick={()=>kickHandle(id)}
                  icon={faXmark} 
                  style={{
                    cursor: "pointer",
                    visibility: room.moderator ? "visible" : "hidden" 
                  }} 
                  />
              </Grid>
            </Grid>
          )
        )}
      </Grid>
  );
}
