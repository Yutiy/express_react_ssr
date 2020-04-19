import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { getHomeList } from '../store/actions/home'
import WithStyle from '../app/WithStyle';
import styles from './style.css';

class Home extends React.Component {
  componentDidMount() {
    if (!this.props.list.length) {
      this.props.getHomeList();
    }
  }

  getList() {
    const { list } = this.props
    return list.map(item => <div key={item.id}>{item.title}</div>)
  }

  render() {
    const { name } = this.props;

    return (
      <Fragment>
        <Helmet>
          <title>技术博客，分享前端知识</title>
          <meta name="description" content="技术博客，分享前端知识"/>
        </Helmet>

        <div>this is Home, name is { name }</div>
        <div>{ this.getList() }</div>
        <button onClick={() => console.log('clicked')}>click</button>
      </Fragment>
    )
  }
}

Home.loadData = (store) => {
  return store.dispatch(getHomeList());
}

const mapStateToProps = state => ({
  list: state.home.list,
  name: state.home.name,
})

const mapDispatchToProps = dispatch => ({
  getHomeList() {
    dispatch(getHomeList());
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(WithStyle(Home, styles));
