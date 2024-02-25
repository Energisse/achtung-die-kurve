import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Grid, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useRef } from "react";
import {
  Circle,
  Line,
  getSocket,
  useGetRoomInfosQuery,
  useSetDirectionMutation,
} from "./api/api";
let directions: Array<"right" | "left" | "forward"> = ["forward"];

export default function Room() {
  const { data: room } = useGetRoomInfosQuery();
  const [send] = useSetDirectionMutation();
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let powerUps: Array<{
      x: number;
      y: number;
      radius: number;
      id: string;
      other: boolean;
      type: string;
    }> = [];

    let players: Array<{
      tail: Array<Line>;
      position: Circle;
      color: string;
    }> = [];

    getSocket().on('powerUp:Added',(powerUp: {x: number, y: number, radius: number, id: string, other: boolean,      type: string}) => {
      powerUps.push(powerUp);
    });
    getSocket().on('powerUp:Removed', (id: string[]) => {
      powerUps = powerUps.filter(p => !id.includes(p.id));
    });

    
    getSocket().on("start", () => {
      players = [];
      powerUps = [];
    });

    getSocket().on(
      "tick",
      (
        data: Array<{
          newTail: Line | null;
          position: Circle;
          color: string;
        } | null>
      ) => {
        data.forEach((d, index) => {
          if (!d) return;
          if (!players[index]) {
            players[index] = {
              tail: [],
              position: d.position,
              color: d.color,
            };
          }
          if (d.newTail) players[index].tail.push(d.newTail);
          players[index].position = d.position;
        });

       

        const render = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          powerUps.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
            ctx.fillStyle = p.other ? "red" : "green";
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = 'middle';
            ctx.font = "20px Arial";
            ctx.fillText(p.type[0], p.x, p.y);
          });

          players.forEach(
            ({ position: { x, y, radius }, tail, color }, index) => {
              ctx.strokeStyle = color;
              ctx.beginPath();
              tail.forEach(({ p1, p2, width }) => {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineWidth = width;
              });
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(x, y, radius, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }
          );
        };
        window.requestAnimationFrame(render);
      }
    );

    return () => {
      getSocket().off("tick");
      getSocket().off("start");
    };
  }, []);

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
      <canvas ref={canvasRef} width={1000} height={1000} />
    </>
  );
}
