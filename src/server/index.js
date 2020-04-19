import express from 'express';
import proxy from 'express-http-proxy';
import { matchRoutes } from 'react-router-config';
import routes from '../client/router';
import { getStore } from '../client/store';
import { render } from './utils';

const app = express()
app.use(express.static('dist'))

app.use('/api', proxy('http://localhost:4000', {
  proxyReqPathResolver: function(req) {
    return '/api' + req.url;
  }
}));

app.get('*', function(req, res) {
  const store = getStore();

  const promises = [];
  const matchedRoutes = matchRoutes(routes, req.path);
  matchedRoutes.forEach(item => {
    if (item.route.loadData) {
      const promise = new Promise((resolve, reject) => {
        item.route.loadData(store).then(resolve).catch(resolve);
      })
      promises.push(promise);
    }
  })

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
})

app.listen('3000', function() {
  console.log('listen in:3000')
})
