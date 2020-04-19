import axios from 'axios';

const instance = axios.create({
  baseURL: '/', // 当前路径的node服务
})

export default instance;
