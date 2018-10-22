import { FETCH_USERS } from '../actions'; // named export (not default) so we use {}

export default (state = [], action) => {
  switch (action.type) {
    case FETCH_USERS:
      return action.payload.data;
    default:
      return state;
  }
};
