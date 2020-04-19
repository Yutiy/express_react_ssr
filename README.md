# React服务端渲染

## 实现React组件中服务端渲染

首先写个简单的 React 组件:

```jsx
// client/containers/Home.js
import React from 'react';

class Home = () => {
  return (
    <div>
      <button onClick={() => console.log('click button')}>button</button>
      <div>This is Home</div>
    </div>
  )
}

export default Home;
```

现在就是要将它转换为 html 返回给浏览器。JSX中的标签其实是基于虚拟 DOM，虚拟 DOM 其实就是 JS 对象，最终通过一定的方法将其转换为真实 DOM，因此可以看出整个服务端的渲染流程就是通过虚拟DOM的编译来完成的。

`react-dom` 库有提供编译虚拟 DOM 的方法，做法如下:

```es6
// server/index.js
import express from 'express'
import { renderToString } from 'react-dom/server'
import Home from './containers/Home'

const app = express()
const content = renderToString(<Home />)

app.get('/', function(req, res) {
  res.send(
    `
    <html>
      <head>
        <title>react-ssr</title>
      </head>
      <body>
        <div id="root">${content}</div>
      </body>
    </html>
    `
  )
})

app.listen(3000, () => {
  console.log('listen:3000')
})
```

启动 express 服务，可以看出页面上显示 `This is Home`。这就实现了一个简单的服务端渲染。

## 引入同构

前面的同构是不完整的，比如上面在一个 button 上面绑定的事件，就会失效，因为 `renderToString` 并没有做事件相关的处理，因此返回给浏览器的内容不会有事件绑定。

因此就需要同构，同构就是一套 React 代码在服务端运行一遍完成结构渲染，然后在浏览器再运行一遍完成事件绑定。

做法非常简单，如下:

```es6
// client/app/index.js
import React from 'react';
import ReactDom from 'react-dom';
import Home from '../containers/Home';

ReactDom.hydrate(<Home />, document.getElementById('root'))
```

然后使用 webpack 将其打包成 `index.js`:

```es6
// webpack.client.config.js
const path = require('path')

module.exports = {
  mode: 'development',
  entry: {
    index: ['react-hot-loader/patch', resovePath('../src/client/app/index.js')]
  },
  output: {
    filename: '[name].js',
    path: resovePath('../dist'),
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      }
    ]
  }
}


// package.json - script
{
  "scripts": {
    "dev": "npm-run-all --parallel dev:**",
    "dev:start": "nodemon --watch dist --exec node \"./dist/bundle.js\"",
    "dev:build:server": "webpack --config ./build/webpack.server.config.js --watch",
    "dev:build:client": "webpack --config ./build/webpack.client.config.js --watch"
  },
}
```

因为把 bundle 输出到了 dist 目录中，因此 express 需要开启静态服务, 前端的 script 才能拿到控制浏览器的JS代码:

```es6
const app = express()
app.use(express.static('dist'))
```

总结同构代码执行流程:

- 服务端运行 React 代码生成 HTML
- 发送 HTML 到浏览器
- 浏览器显示 HTML 内容
- 浏览器加载 JS 内容
- JS 代码运行并接管页面操作

## 同构中路由处理

首先写一份路由配置文件:

```es6
// /client/router/index.js
import React from 'react'
import { Route } from 'react-router-dom'
import Home from './containers/Home'
import Login from './containers/Login'

export default (
  <div>
    <Route path="/" exact component={Home}></Route>
    <Route path="/login" exact component={Login}></Route>
  </div>
)
```

其次修改客户端代码，作出相应的更改:

```es6
// client/.js
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import Routes from '../router'

const App = () => {
  return (
    <BrowserRouter>
      { Routes }
    </BrowserRouter>
  )
}

ReactDom.hydrate(<App />, document.getElementById('root'))
```

这个时候控制台会报错，因为在 router/index.js 中，每个 Route 组件外面包裹着一层div，但查看源代码发现服务端返回的代码中并没有这个div, 所以报错。因此需要将服务端的路由逻辑执行一遍:

```es6
// server/index.js
import express from 'express'
import { render } from './utils'

const app = express()
app.use(express.static('dist'))

// 这里要换成*来匹配
app.get('*', function (req, res) {
  res.send(render(req))
})

app.listen(3000, () => {
  console.log('listen:3000')
})

// server/utils.js
import React from 'react'
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import Routes from '../Routes'

export const render = (req) => {
  // 构建服务端的路由
  const content = renderToString(
    <StaticRouter location={req.path} >
      {Routes}
    </StaticRouter>
  );

  return `
    <html>
      <head>
        <title>react-ssr</title>
      </head>
      <body>
        <div id="root">${content}</div>
        <script src="/index.js"></script>
      </body>
    </html>
  `
}
```

现在路由的跳转就没有任何问题啦。 注意，这里仅仅是一级路由的跳转，多级路由的渲染在之后的系列中会用 react-router-config 中 renderRoutes 来处理。

## 同构中引入 redux

创建全局 store:

```es6
// store/index.js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import homeReducer from './reducers/home';

const reducer = combineReducers({
  home: homeReducer
})

const store = createStore(reducer, applyMiddleware(thunk));
export default () => store // 避免store单例

// store/constants.js
export const CHANGE_LIST = 'HOME/CHANGE_LIST';

// store/action/home.js
import axios from 'axios';
import { CHANGE_LIST } from "../constants";

const changeList = list => ({
  type: CHANGE_LIST,
  list
});

export const getHomeList = () => {
  return (dispatch) => {
    return axios.get('xxx')
      .then((res) => {
        const list = res.data.data;
        dispatch(changeList(list))
      });
  };
}

// store/reducer/home
import { CHANGE_LIST } from "./constants";

const defaultState = {
  name: 'yutiy',
  list: []
}

export default (state = defaultState, action) => {
  switch(action.type) {
    case CHANGE_LIST:
      const newState = {
        ...state,
        newsList: action.list
      };
      return newState;
    default:
      return state;
  }
}
```

修改Home组件，连接至store:

```es6
import React from 'react';
import { connect } from 'react-redux'

class Home extends React.Component {
  render() {
    const { name, list } = this.props;

    return (
      <div>
        <div>this is Home, name is { name }</div>
        <div>{ (list || []).map(item => <div key={item.id}>{item.title}</div>) }</div>
        <button onClick={() => console.log('clicked')}>click</button>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  name: state.home.name,
  list: state.home.list,
})

const mapDispatchToProps = dispatch => ({
  getHomeList() {
    dispatch(getHomeList());
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(Home);
```

修改 client 与 server 入口文件，通过 Provider 来连接至 store:

```es6
// client/app/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import Routes from '../router';
import store from '../store';

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        { Routes }
      </BrowserRouter>
    </Provider>
  )
}

ReactDOM.hydrate(<App />, document.getElementById('root'))

// server/utils.js
import React from 'react'
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import Routes from '../client/router';
import store from '../client/store';

export const render = (req) => {
  // 构建服务端的路由
  const content = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.path} >
        {Routes}
      </StaticRouter>
    </Provider>
  );

  return `
    <html>
      <head>
        <title>react-ssr</title>
      </head>
      <body>
        <div id="root">${content}</div>
        <script src="/index.js"></script>
      </body>
    </html>
  `
}

```

## 异步数据的服务端渲染(数据注水与脱水)

在 `componentDidMount` 请求的数据，源代码里面并没有显示列表数据，这是为什么呢?

- 当浏览器发送请求时，服务器接受到请求，这时候服务器和客户端的 store 都是空的
- 紧接着客户端执行 componentDidMount 生命周期中的函数，获取到数据并渲染到页面
- 然而服务器端始终不会执行 componentDidMount，因此不会拿到数据，这也导致服务器端的 store 始终是空的

因此需要服务端将获得数据的操作执行一遍，才能达到真正的服务端渲染。

**改造路由**

```es6
import Home from '../containers/Home';
import Login from '../containers/Login';

export default [
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
  }
];
```

其中加入了一个 loadData 参数，这个参数代表了服务端获取数据的函数。每次渲染一个组件获取异步数据时，都会调用相应组件的这个函数。因此要针对不同的路由来匹配不同的 loadData 函数

```es6
// server/index.js
import express from 'express';
import { matchRoutes } from 'react-router-config';
import routes from '../client/router';
import store from '../client/store';
import { render } from './utils';
import { matchRoutes } from 'react-router-config';

app.get('*', function(req, res) {
  const getStore = store();

  const promises = [];
  const matchedRoutes = matchRoutes(routes, req.path);
  matchedRoutes.forEach(item => {
    if (item.route.loadData) {
      const promise = new Promise((resolve, reject) => {
        item.route.loadData(getStore).then(resolve).catch(resolve);
      })
      promises.push(promise);
    }
  })

  Promise.all(promises).then(() => {
    const html = render(req, getStore);
    res.send(html);
  })
})
```

**数据的脱水和注水**

这里还有一些细节问题，假如我们把生命周期里面异步请求的函数注释，会导致限制页面不会有异步数据，但是查看源代码发现数据已经挂载到了服务端返回的 HTML 上，这反映出服务端的 store 和客户端的 store 并不同步。

*当服务端拿到store并获取数据后，客户端的js代码又执行一遍，在客户端代码执行的时候又创建了一个空的store，导致两个store的数据不能同步。*

首先服务端返回的 html 中加入一个 script 标签，进行数据的注水操作:

```es6
// 把服务端的 store 数据注入到 window 全局环境中
<script>
window.context = {
  state: ${JSON.stringify(store.getState())}
}
</script>
```

接下来进行数据的脱水操作，也就是把 `window.context` 绑定的数据给到客户端的 store，可以在客户端的源头 store 进行处理:

```es6
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import homeReducer from '../containers/Home';

const reducer = combineReducers({
  home: homeReducer
})

// 服务端的store创建函数
export const getStore = () => {
  return createStore(reducer, applyMiddleware(thunk));
}

// 客户端的store创建函数
export const getClientStore = () => {
  const defaultState = window.context ? window.context.state : {};
  return createStore(reducer, defaultState, applyMiddleware(thunk));
}
```

最后，对 ajax 请求做一下优化，当服务端获取数据之后，客户端并不需要再发送请求了，否则就浪费性能了。

```es6
// client/container/Home
componentDidMount() {
  if (!this.props.list.length) {
    this.props.getHomeList();
  }
}
```

## 使用node作为中间层以及优化请求

之前的处理，服务端和客户端都是用同一套请求后端接口的代码，这并不是特别科学，对客户端而言，最好通过 node 中间层。

利用 axios 的 `instance` 和 thunk 里面的 `withExtraArgument` 来做一些封装:

```es6
// server/request.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://xxxxxx(服务端地址)'
})
export default instance;

// client/app/request.js
import axios from 'axios';

const instance = axios.create({
  baseURL: '/' // 当前路径的node服务
})
export default instance;


// client/store/index.js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import homeReducer from '../containers/Home';
import clientAxios from '../app/request';
import serverAxios from '../server/request';

const reducer = combineReducers({
  home: homeReducer
})

export const getStore = () => {
  // 让thunk中间件带上serverAxios
  return createStore(reducer, applyMiddleware(thunk.withExtraArgument(serverAxios)));
}
export const getClientStore = () => {
  const defaultState = window.context ? window.context.state : {};
   // 让thunk中间件带上clientAxios
  return createStore(reducer, defaultState, applyMiddleware(thunk.withExtraArgument(clientAxios)));
}
```

现在 Home 组件中请求数据的 action 无需传参，使用如下:

```es6
export const getHomeList = () => {
  // 返回函数中的默认第三个参数是withExtraArgument传进来的axios实例
  return (dispatch, getState, axiosInstance) => {
    return axiosInstance.get('/api/list.json')
      .then((res) => {
        const list = res.data.data;
        dispatch(changeList(list))
      })
  }
}
```

同时，server 入口文件中加入 proxy 进行代理，如下:

```es6
import proxy from 'express-http-proxy';

app.use('/api', proxy('http://xxxxxx(服务端地址)', {
  proxyReqPathResolver: function(req) {
    return '/api' + req.url;
  }
}));
```

## 多级路由渲染(renderRoutes)

首先改造路由配置如下:

```es6
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
```

对于多级路由的渲染，需要客户端和服务端各执行一次，因此改造相应的 JSX 代码如下:

```es6
// server
<Provider store={store}>
  <StaticRouter location={req.path} >
    {renderRoutes(routes)}
  </StaticRouter>
</Provider>

// client
<Provider store={getClientStore()}>
  <BrowserRouter>
    {renderRoutes(routes)}
  </BrowserRouter>
</Provider>
```

其中，`renderRoutes` 由 `react-router-config` 导出，用来根据路由渲染一层路由组件，因此 Layout 也相应改造如下:

```es6
import React from 'react';
import { renderRoutes } from 'react-router-config';
import Header from '../components/Header';

const  App = (props) => {
  return (
    <div>
      <Header></Header>
      <!-- 拿到Login和Home组件的路由 -->
      {renderRoutes(props.route.routes)}
    </div>
  )
};

export default App;
```

## CSS服务端渲染

首先安装 loader 进行处理css，客户端安装 `style-loader, css-loader`, 另外服务端安装 `isomorphic-style-loader`，并修改相应 webpack 配置文件

然后编写 `WithStyle` 高阶组件:

```es6
import React, { Component } from 'react';

export default (DecoratedComponent, styles) => {
  return class WrappedComponent extends Component {
    componentWillMount() {
      if (this.props.staticContext) {
        this.props.staticContext.css.push(styles._getCss());
      }
    }

    render() {
      return <DecoratedComponent {...this.props} />
    }
  };
}
```

然后在服务端处理之后，利用 staticContext 进行处理css，修改如下:

```es6
Promise.all(promises).then(() => {
  let context = { css: [] };
  const html = render(store, routes, req, context);

  if(context.action === 'REPLACE') {
    res.redirect(301, context.url);
  } else if(context.NotFound) {
    res.status(404);
    res.send(html);
  } else {
    res.send(html);
  }
})
```

## SEO处理

以 Home 组件为例，改造如下:

```es6
<Helmet>
  <title>技术博客，分享前端知识</title>
  <meta name="description" content="技术博客，分享前端知识"/>
</Helmet>
```

然后改造服务端，utils修改如下:

```es6
export const render = (store, routes, req, context) => {
  const content = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.path} context={context}>
        {renderRoutes(routes)}
      </StaticRouter>
    </Provider>
  );

  // 拿到helmet对象，然后在html字符串中引入
  const helmet = Helmet.renderStatic();
  const cssStr = context.css.length ? context.css.join('\n') : '';

  return `
    <html>
      <head>
        <title>react-ssr</title>
        <style>${cssStr}</style>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
      </head>
      <body>
        <div id="root">${content}</div>
        <script>
          window.context = {
            state: ${JSON.stringify(store.getState())}
          }
        </script>
        <script src="/index.js"></script>
      </body>
    </html>
  `
};
```
