// import { store } from '../../store/index';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // useDispatch
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Image from 'material-ui-image'
import history from '../../history';
import { backToProfileRequest } from '../../store/userSlice';
import './Details.scss';

export default function Details ({ match }) {
  const dishes = [...useSelector((state) => state.user.dishesInRadius)];
  const [dish, setDish] = useState(...dishes.filter((dish) => dish._id === match.params.dishId));
  const user = useSelector((state) => state.user.userData);

  const updateDish = async () => {
    setDish(dish); // TODO: add title, description,  recipe update
  }

  const dispatch = useDispatch();

  const handleBack = async () => {
    await dispatch(backToProfileRequest());
    history.push('/profile')
  }
  // TODO: add votes
  return (
    <div>
    <Grid container spacing={2}>
      <Grid item xs={12} md={12} lg={12}  className='dish-publisher'>
        {`${dish.creatorName} from ${dish.city}`}
      </Grid>
      <Grid item xs={12} md={12} lg={12} className='dish-title'>
        {`${dish.title}`}
      </Grid>
      <Grid item xs={12} md={12} lg={12}>
        <Image
          src={dish.imageUrl}
          imageStyle={{ width:"58%", height:"100%", "borderRadius": "2.5%"}}
          style={{"backgroundColor": "inherit", "marginTop": "0%", "marginLeft": "30%", "padding": "10%"}}
        />
      </Grid>
      <Grid item xs={12} md={12} lg={12} className='dish-description'>
        {`${dish.description}`}
      </Grid>
      <Grid item xs={12} md={12} lg={12} className='dish-recipe'>
        {`${dish.recipe}`}
      </Grid>
      { user._id == dish.userID
        ?
          <Grid item xs={12} md={12} lg={12}>
            <Button
              variant="contained"
              color="primary"
              id="logout-button"
              // startIcon={<ExitToAppIcon />}
              // style={logOutButtonStyle}
              onClick={updateDish}
              >
              Update
            </Button>
          </Grid>
        : ''
      }
      <Grid item xs={12} md={12} lg={12}>
        <Button
          variant="contained"
          color="primary"
          id="logout-button"
          // startIcon={<ExitToAppIcon />}
          // style={logOutButtonStyle}
          onClick={handleBack}
          >
          Back
        </Button>
      </Grid>
    </Grid>
    </div>

  );
}