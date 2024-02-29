import { useCallback, useEffect, useRef } from "react";
import {
  Circle,
  Line,
  getSocket,
  useSetDirectionMutation
} from "./api/api";
let directions: Array<"right" | "left" | "forward"> = ["forward"];

export default function Board() {
  const [send] = useSetDirectionMutation();
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
      id: string;
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

    getSocket().on('tail:Removed', ({parts,player}:{
      player: string
      parts: number[]
  }) => {
    const playerIndex = players.findIndex(p => p.id === player);
    if(playerIndex === -1) return;
    players[playerIndex].tail = players[playerIndex].tail.filter((_, i) => !parts.includes(i));  
    });
    
    getSocket().on("start", () => {
      players = [];
      powerUps = [];
    });

    getSocket().on(
      "tick",
      (
        data: Array<{
          id: string;
          newTail: Line | null;
          position: Circle;
          color: string;
        } | null>
      ) => {
        data.forEach((d, index) => {
          if (!d) return;
          if (!players[index]) {
            players[index] = {
              id: d.id,
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
    <canvas ref={canvasRef} width={1000} height={1000} />
  );
}
