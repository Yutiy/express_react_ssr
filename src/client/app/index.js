import React from 'react';
import ReactDOM from 'react-dom';
import { renderRoutes } from 'react-router-config';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import routes from '../router';
import { getClientStore } from '../store';

const App = () => {
  return (
    <Provider store={getClientStore()}>
      <BrowserRouter>
        { renderRoutes(routes) }
      </BrowserRouter>
    </Provider>
  )
}

ReactDOM.hydrate(<App />, document.getElementById('root'))
