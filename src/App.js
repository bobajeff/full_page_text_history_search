import SearchBar from './searchbar';
import search, {highlightTokens, LoadMoreHits} from './search';
import TrackScroll from './trackscroll';
import getDate from './date_format';
import Box from '@material-ui/core/Box';
import React, { useState, useEffect, useRef } from "react";
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import { ThemeProvider } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Link from '@material-ui/core/Link';


const theme = createMuiTheme({
  palette: {
    primary:
    {
      main: blue[800]
    }
  },
});

function App() {


  const [resultSearch, setResults] = useState([]);
  const [resultLayout, setLayout] = useState([]);
  
  const ref = useRef();

  useEffect(() => {
    let arrayItems = [];
    for (let i = 0; i < resultSearch.length; i++) {
      const result = resultSearch[i];

      var matches = highlightTokens(result);

      arrayItems.push(
    <Box py={2} px={8} key={i}>
      <Typography>
        {getDate(result.timestamp)}
      </Typography>
        <Typography noWrap gutterBottom variant="h5" component="h2">
            <Link href={result.address} rel="noopener noreferrer" target="_blank">
                {result.title}
            </Link>
        </Typography>
        <Typography variant="body2"  component="p">
        {matches}
        </Typography>
        <Typography noWrap variant="body2" color="textSecondary" component="p">
            <Link href={result.address} rel="noopener noreferrer" target="_blank">
                {result.address}
            </Link>
        </Typography>
    </Box>
      );
    }
    setLayout(arrayItems);
  }, [resultSearch]);
  
  return (
    <React.Fragment>
      <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flex-direction="column" height="100%">
      <TrackScroll refprop={ref} onScrollEnd={()=>{
        LoadMoreHits().then((nextresult)=>{
        if (!!nextresult)
        {
          setResults(resultSearch.concat(nextresult));
        }
      });}
      }>
    <SearchBar 
    title="History"
    placeholder="Search History"
    onChange={async(searchtext)=>{
      ref.current.scrollTo(0, 0);
      let results = await search(searchtext);
      setResults(results);
      }}/>
      

        <Paper elevation={1}>
          {resultLayout}
        </Paper>
      </TrackScroll>
      </Box>
      </ThemeProvider>
      </React.Fragment>
  );
}

export default App;
