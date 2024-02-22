import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Grid, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useRef } from "react";
import {
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
    }> = [];

    const board: Array<Array<Line>> = [];

    getSocket().on("tick", (data: Array<Line | null>) => {
      data.forEach((d, index) => {
        if (!board[index]) {
          board[index] = [];
        }
        if (d) board[index].push(d);
      });

      getSocket().on("powerUp", (p) => {
        powerUps = p;
      });

      getSocket().on("start", () => {
        board.forEach((lines, index) => {
          board[index] = [];
        });
      });

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        powerUps.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
          ctx.fillStyle = "green";
          ctx.fill();
        });

        board.forEach((lines, index) => {
          ctx.beginPath();
          lines.forEach((line) => {
            if (line.invisible) {
              ctx.moveTo(line.start.x, line.start.y);
              return;
            }
            ctx.lineTo(line.start.x, line.start.y);
            ctx.lineTo(line.end.x, line.end.y);
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.strokeWidth;
          });
          const {
            end: { x, y },
            color,
          } = lines.at(-1)!;

          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        });
      };
      window.requestAnimationFrame(render);
    });

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
