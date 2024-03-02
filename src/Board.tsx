import { useCallback, useEffect, useRef } from "react";
import {
  Circle,
  Line,
  getSocket,
  useIsPausedQuery,
  useSetDirectionMutation
} from "./api/api";
let directions: Array<"right" | "left" | "forward"> = ["forward"];

export default function Board() {
  const { data: isPaused } = useIsPausedQuery();
  const [send] = useSetDirectionMutation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keydown = useCallback(
    (e: KeyboardEvent) => {
      if(e.repeat) return;
      if(e.key === " ") {
        if(e.type === "keydown") getSocket().emit("pause", () => {});
        return;
      }
      let last = directions[directions.length - 1];
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
      if(last !== directions[directions.length - 1])  send(directions[directions.length - 1]);
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
      id: string;
      tail: Array<Line>;
      position: Circle;
      color: string;
    }> = [];

      
    getSocket().on("start", () => {
      players = [];
      powerUps = [];
    });

    getSocket().on(
      "tick",
      (
        data: {
          player: {
            added?: Array<{
                id: string
                position: Circle
                newTail?: Line
                color: string
            }>,
            removed?: Array<{
                id: string
                parts: number[]
            }>,
        },
        powerUp: {
            added?: {
                x: number
                y: number
                radius: number
                id: string
                type: string
                other: boolean
            }[],
            removed?: string[]
        }
      }
      ) => {
        console.log(data);
        data.player.added?.forEach((d) => {
          if (!d) return;
          let player = players.find((p) => p.id === d.id);
          if (!player) {
            player = {
              id: d.id,
              tail: [],
              position: d.position,
              color: d.color,
            }
            players.push(player);
          }
          if (d.newTail) player.tail.push(d.newTail);
          player.position = d.position;
        });

        data.powerUp.added?.forEach((p) => {
          if (!p) return;
          powerUps.push(p);
        });

        data.powerUp.removed?.forEach((p) => {
          powerUps = powerUps.filter((powerUp) => powerUp.id !== p);
        });

        data.player.removed?.forEach((d) => {
          const playerIndex = players.findIndex(p => p.id === d.id);
          if(playerIndex === -1) return;
          players[playerIndex].tail = players[playerIndex].tail.filter((_, i) => !d.parts.includes(i));  
        });

        const render = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
            
          powerUps.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius < 1 ? 1 : p.radius , 0, 2 * Math.PI);
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
              let lastWidth = tail[0]?.width;
              let lastX = tail[0]?.p1.x;
              let lastY = tail[0]?.p1.y;
              ctx.lineWidth = lastWidth;
              ctx.moveTo(tail[0]?.p1.x, tail[0]?.p1.y);

              tail.forEach(({ p1, p2, width }) => {
                if(p1.x === lastX && p1.y === lastY) {
                  ctx.lineTo(p1.x, p1.y);
                }
                else{
                  ctx.moveTo(p1.x, p1.y);
                }
                lastX = p2.x;
                lastY = p2.y;
                ctx.lineTo(p2.x, p2.y);
                if(lastWidth !== width){
                  ctx.stroke();
                  ctx.beginPath();
                  lastWidth = width;
                  ctx.lineWidth = lastWidth;
                }
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
    <div style={{
      position: "relative",
      width: "1000px",
      height: "1000px",
    }}>
      {isPaused && <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.5)", color: "white", padding: "1em", borderRadius: "1em"}}>Paused</div>}
    <canvas ref={canvasRef}  width={1000} height={1000} style={{
      border: "1px solid lightblue"
    }}>
      </canvas>
    </div>
  );
}
