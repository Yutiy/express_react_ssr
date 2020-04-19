import React from 'react';
import { renderRoutes } from 'react-router-config';
import Header from '../components/Header';

const  App = (props) => {
  return (
    <div>
      <Header></Header>
      {renderRoutes(props.route.routes)}
    </div>
  )
};

export default App;
