import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getSocket,
  useGetRoomInfosQuery,
  useSetDirectionMutation,
} from "./api/api";
import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { Button, Grid, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect } from "react";
let directions: Array<"right" | "left" | "forward"> = ["forward"];

export default function Room() {
  const { data: room } = useGetRoomInfosQuery();
  const [send] = useSetDirectionMutation();
  const theme = useTheme();

  const keydown = useCallback(
    (e: KeyboardEvent) => {
      if (e.type === "keyup") {
        if (e.key === "ArrowLeft") {
          directions = directions.filter((d) => d !== "left");
        } else if (e.key === "ArrowRight") {
          directions = directions.filter((d) => d !== "right");
        }
      } else {
        if (e.key === "ArrowLeft") {
          if (!directions.includes("left")) {
            directions.push("left");
          }
          // left is aleady in the array
          else if (directions.at(-1) !== "left") {
            directions = directions.filter((d) => d !== "left");
            directions.push("left");
          }
        } else if (e.key === "ArrowRight") {
          if (!directions.includes("right")) {
            directions.push("right");
          }
          // right is aleady in the array
          else if (directions.at(-1) !== "right") {
            directions = directions.filter((d) => d !== "right");
            directions.push("right");
          }
        }
      }

      console.log(directions);
      send(directions[directions.length - 1]);
    },
    [send]
  );

  useEffect(() => {
    window.addEventListener("keyup", keydown);
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keyup", keydown);
      window.removeEventListener("keydown", keydown);
    };
  }, [keydown]);

  return (
    <>
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
          ({ name, isModerator, id, color, points }, index) => (
            <Grid item container xs={12} p={1}>
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
              </Grid>
            </Grid>
          )
        )}
      </Grid>
      <Button
        onClick={() => {
          getSocket().emit("start");
        }}
      >
        Start
      </Button>
      <svg
        width="1000px"
        height="1000px"
        style={{
          background: theme.palette.dark300,
        }}
      >
        {room?.board?.map((positions, index) => (
          <path
            d={`M${positions.map(([x, y]) => `${x},${y}`).join("L")}`}
            fill="none"
            strokeWidth="2"
            stroke={room?.leaderboard[index].color}
          />
        ))}
      </svg>
    </>
  );
}
