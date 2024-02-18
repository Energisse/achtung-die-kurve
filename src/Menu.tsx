import { Grid, Paper, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import {
  useCreateServerMutation,
  useGetServersQuery,
  useJoinServerMutation,
} from "./api/api";

export default function Menu() {
  const { data: servers } = useGetServersQuery();
  const [joinServer] = useJoinServerMutation();
  const [createServer] = useCreateServerMutation();
  const [username, setUsername] = useState<string>("");
  const theme = useTheme();

  const onJoin = (serverId: string) => {
    if (!username) return alert("Please enter a username");
    joinServer({ serverId, username })
      .unwrap()
      .then(() => console.log("success"))
      .catch(() => console.log("failed"));
  };

  const onCreate = () => {
    if (!username) return alert("Please enter a username");
    createServer(username)
      .unwrap()
      .then(() => console.log("success"))
      .catch(() => console.log("failed"));
  };

  return (
    <Grid
      container
      flexDirection={"row"}
      alignContent={"flex-start"}
      sx={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <Grid item xs={12}>
        <TextField
          label="Username"
          variant="outlined"
          sx={{
            background: theme.palette.dark200,
            borderRadius: theme.spacing(1),
          }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </Grid>
      {servers?.map(({ created, maxPlayers, players, id }) => (
        <Grid item key={id} xs={6}>
          <Paper
            sx={{
              background: theme.palette.dark200,
              padding: theme.spacing(2),
              margin: theme.spacing(2),
              color: "white",
            }}
          >
            <Grid container flexDirection={"column"}>
              <Grid item>{id}</Grid>
              <Grid item>
                {players}/{maxPlayers}
              </Grid>
              <Grid item>{created}</Grid>
              <Grid item>
                <Button
                  sx={{
                    background: theme.palette.primary500,
                    color: theme.palette.dark100,
                    "&:hover": {
                      background: theme.palette.primary600,
                    },
                  }}
                  onClick={() => onJoin(id)}
                >
                  Join
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}
      <Button onClick={onCreate}>Create</Button>
    </Grid>
  );
}
