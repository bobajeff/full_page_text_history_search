import React, {useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import { fade, makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';


const useStyles = makeStyles((theme) => ({
  title: {
    flexGrow: 0.4,
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.black, 0.25),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(1),
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ClearIconHidden:{
    visibility: "hidden"
  },
  ClearIconVisible: {
    color: 'inherit',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1.8, 1, 1.8, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    paddingRight: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '80ch',
    },
  },
}));

export default function SearchAppBar(props) {
  const[cleartext, setClear] = useState(false);
  const [enteredText, setEnteredText] = useState(''); 

  const classes = useStyles();

  return (
      <AppBar position="sticky">
        <Toolbar>
          <Typography className={classes.title} variant="h6" noWrap>
            {props.title}
          </Typography>
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <div >

            </div>
            <InputBase
              inputRef={input => input && input.focus()}
              placeholder={props.placeholder}
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ 'aria-label': 'search' }}
              value={enteredText}
              onChange={(event) => {
                setEnteredText(event.target.value);
                props.onChange(event.target.value);
                if (event.target.value.length > 0)
                {
                  setClear(true);
                }
                else
                {
                  setClear(false);
                }
              }
        }
              endAdornment={
              <InputAdornment position="end">
              <IconButton className={cleartext ? classes.ClearIconVisible : classes.ClearIconHidden} onClick={()=>{setEnteredText('');setClear(false);props.onChange('');}}>
            <ClearIcon />
            </IconButton>
            </InputAdornment>
              }
            />
          </div>
        </Toolbar>
      </AppBar>
  );
}
