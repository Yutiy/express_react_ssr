import React from 'react'
import { renderToString } from 'react-dom/server';
import { renderRoutes } from 'react-router-config';
import { StaticRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Helmet } from 'react-helmet';

export const render = (store, routes, req, context) => {
  // 构建服务端的路由
  const content = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.path} context={context}>
        { renderRoutes(routes) }
      </StaticRouter>
    </Provider>
  );

  // 拿到helmet对象，然后在html字符串中引入
  const helmet = Helmet.renderStatic();

  // 拼接代码
  const cssStr = context.css.length ? context.css.join('\n') : '';

  return `
    <html>
      <head>
        <title>react-ssr</title>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        <style>${cssStr}</style>
      </head>
      <body>
        <div id="root">${content}</div>
        <script src="/index.js"></script>

        <script>
          window.context = {
            state: ${JSON.stringify(store.getState())}
          }
        </script>
      </body>
    </html>
  `
}
