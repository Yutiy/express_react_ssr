import axios from 'axios';
import { CHANGE_LIST } from "../constants";

// 普通action
const changeList = list => ({
  type: CHANGE_LIST,
  list
});

// 异步操作的action(采用thunk中间件)
export const getHomeList = () => {
  return (dispatch) => {
    return axios.get('/api/list.json')
      .then((res) => {
        const list = res.data.data;
        dispatch(changeList(list));
      }).catch(e => {
        const list = [
          { id: '1', title: '1111' },
          { id: '2', title: '2222' },
          { id: '3', title: '3333' },
        ];
        dispatch(changeList(list));
      })
  };
}
