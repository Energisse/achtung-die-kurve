import { Grid, Paper } from "@mui/material";
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import {
    useGetServersQuery, useJoinServerMutation
} from "./api/api";

export default function Menu() {
  const {data:servers} = useGetServersQuery();
  const [joinServer] = useJoinServerMutation();

  const theme = useTheme()

  const onJoin = (id:string) => {
    joinServer(id).unwrap().then(()=>console.log("success")).catch(()=>console.log('failed'));
  }


  return (
    <Grid
     container 
     flexDirection={"row"}
     alignContent={"flex-start"}
    sx={{
      width:"100vw",
      height:"100vh",
    }}>
      {servers?.map(({created,maxPlayers,players,id}) => (
        <Grid item key={id} xs={6}>
          <Paper sx={{
            background:theme.palette.dark200,
            padding:theme.spacing(2),
            margin:theme.spacing(2),
            color:"white"
          }}>
            <Grid container flexDirection={"column"}>
              <Grid item>
                {id}
              </Grid>
              <Grid item>
                {players}/{maxPlayers}
              </Grid> 
              <Grid item>
                {created}
                </Grid>
                <Grid item>
                  <Button sx={{
                    background:theme.palette.primary500,
                    color:theme.palette.dark100,
                    '&:hover':{
                      background:theme.palette.primary600,
                    }
                  }}
                  onClick={()=>onJoin(id)}
                  >
                    Join
                  </Button>
                </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}