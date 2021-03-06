import React from 'react'
import {Route, IndexRoute, browserHistory} from 'react-router'
import App from 'containers/App'

import Home from 'containers/Home'
import Feeds from 'containers/Home/Feeds'
import Profile from 'containers/Home/Profile'
import Links from 'containers/Links'
import LinksMain from 'containers/Links/Main'
import LinkPage from 'containers/Links/LinkPage'
import Videos from 'containers/Videos'
import VideosMain from 'containers/Videos/Main'
import VideoPage from 'containers/Videos/VideoPage'

import {createStore, combineReducers, applyMiddleware, compose} from 'redux'
import * as reducers from 'redux/reducers'
import {routerReducer, routerMiddleware, syncHistoryWithStore} from 'react-router-redux'
import ReduxThunk from 'redux-thunk'

let storeElements = [
  combineReducers({
    ...reducers,
    routing: routerReducer
  })
]
let middlewares = [
  ReduxThunk
]

if (typeof window !== 'undefined') {
  storeElements.push(window.__INITIAL_STATE__)
  if (browserHistory) middlewares.push(routerMiddleware(browserHistory))
}

export const store = createStore(
  ...storeElements,
  compose(
    applyMiddleware(...middlewares)
  )
)

export const history = browserHistory ? syncHistoryWithStore(browserHistory, store) : null

export const routes = (
  <Route
    name="app"
    component={App}
  >
    <Route path="/videos" component={Videos}>
      <IndexRoute component={VideosMain} />
      <Route path=":videoId" component={VideoPage} />
    </Route>
    <Route path="/links" component={Links}>
      <IndexRoute component={LinksMain} />
      <Route path=":linkId" component={LinkPage} />
    </Route>
    <Route path="/" component={Home}>
      <IndexRoute component={Feeds} />
      <Route path=":username" component={Profile} />
    </Route>
  </Route>
)
