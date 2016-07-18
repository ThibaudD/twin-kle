import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {routes, store, history} from 'Root';
import {Router, applyRouterMiddleware} from 'react-router';
import useScroll from 'react-router-scroll';

render(
  <Provider store={store}>
    <Router
      children={routes}
      history={history}
      render={applyRouterMiddleware(useScroll(
        (prevRouterProps, {location}) => {
          if (!prevRouterProps) {
            return [0, 0];
          }
          else {
            return true;
          }
        }
      ))}
    />
  </Provider>,
  document.getElementById('react-view')
);
