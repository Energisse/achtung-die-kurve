import { Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Menu from "./Menu";
import Room from "./Room";
import { useGetRoomInfosQuery } from "./api/api";

export default function App() {
  const { data: currentServer } = useGetRoomInfosQuery();

  const theme = useTheme();

  return (
    <Grid
      container
      flexDirection={"row"}
      alignContent={"flex-start"}
      sx={{
        background: theme.palette.dark100,
        width: "100vw",
        height: "100vh",
      }}
    >
      {currentServer?.leaderboard.length ? <Room></Room> : <Menu></Menu>}
    </Grid>
  );
}
