import React, { Component } from 'react';

class NotFound extends Component {
  componentDidMount() {
    const { staticContext } = this.props;
    staticContext && (staticContext.NotFound = true)
  }

  render() {
    return (
      <div>
        <div>404</div>
      </div>
    );
  }
}

export default NotFound;
