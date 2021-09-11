import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { red } from '@material-ui/core/colors';
import FavoriteIcon from '@material-ui/icons/Favorite';
import ShareIcon from '@material-ui/icons/Share';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import StarsIcon from '@material-ui/icons/Stars';

import moment from 'moment';

import { useState } from 'react';

import ApiClient from '../../services/ApiClient';

import './index.scss';


const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: 345,
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(90deg)',
  },
  avatar: {
    backgroundColor: red[500],
  },
  ownImageColor: {
    color: red[500],
  }
}));



export default function RecipeReviewCard(props) {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);

  const [likeColor, setLikeColor] = useState(false);

  const [votes, setVotes] = useState(props.votes);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleLike = async () => {
    if (props.voteID === props.userID) return;
    setLikeColor(!likeColor);

    let likeResponse;
    let vote = ''
    if(!likeColor) {
      vote = 'up'
    } else {
      vote = 'down';
    }
    try {
      likeResponse = await ApiClient.voteDish(props.voteID, props.dishID, vote);
    } catch(e) {
      console.log(e)
    }
    setVotes(likeResponse.votes)
  }

  const likeColorStatement = props.voteID === props.userID || likeColor ? "#ff0000": 'inherit';

  return (
    <Card className={classes.root} >
      <CardHeader
        avatar={
          <Avatar aria-label="recipe" className={classes.avatar}>
            {votes}
          </Avatar>
        }
        title={props.title}
        subheader={moment(+props.created).format("MMMM Do, YYYY")}
        style={{'textAlign': 'left'}}
      />
      <CardMedia
        className={classes.media}
        image={props.imageUrl}
        title={props.title}
      />
      <CardContent>
        <Typography variant="body2" color="textSecondary" component="p">
          {props.description}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton aria-label="add to favorites"  style={{ color: likeColorStatement}}>
          <FavoriteIcon onClick={handleLike}/>
        </IconButton>
        <IconButton aria-label="share">
          <ShareIcon />
        </IconButton>
        <IconButton
          className={clsx(classes.expand, {
            [classes.expandOpen]: expanded,
          })}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </IconButton>
        { props.voteID === props.userID ?
          <StarsIcon className={classes.ownImageColor}/>
        : ''}
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>{props.creatorName+' from '+props.city+':'}</Typography>
          <Typography paragraph>
            {props.recipe}
          </Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
}
