import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGetRoomInfosQuery } from "./api/api";
import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { Grid, useTheme } from "@mui/material";

export default function Room() {
  const { data } = useGetRoomInfosQuery();
  const theme = useTheme();

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
          fontSize: theme.typography.h4.fontSize,
        }}
      >
        {data?.players.map(({ name, isModerator, id }, index) => (
          <Grid item container xs={12} p={1}>
            <Grid item xs={3}>
              {isModerator && <FontAwesomeIcon icon={faCrown} />}
            </Grid>
            <Grid item>
              <div key={id}>{name}</div>
            </Grid>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
