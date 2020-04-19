import Layout from '../app/layout';
import Home from '../containers/Home';
import Login from '../containers/Login';
import NotFound from '../containers/NotFound';

export default [{
  path: '/',
  component: Layout,
  routes: [
    {
      path: "/",
      component: Home,
      exact: true,
      loadData: Home.loadData, //服务端获取异步数据的函数
      key: 'home'
    },
    {
      path: '/login',
      component: Login,
      exact: true,
      key: 'login'
    },
    {
      path: '*',
      component: NotFound,
    }
  ]
}];
