import { createStore, applyMiddleware, compose } from 'redux';
import { persistState } from 'redux-devtools';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import { hashHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from '../reducers';
import DevTools from '../containers/DevTools';
import { electronEnhancer } from 'redux-electron-store';

const logger = createLogger({
    level: 'info',
    collapsed: true
});

const router = routerMiddleware(hashHistory);

console.warn('setting up dev store');

const enhancer = compose(
    applyMiddleware(thunk, router, logger),
    //  electronEnhancer(true), // ({test: true}),
    DevTools.instrument(),
    persistState(
        window.location.href.match(
            /[?&]debug_session=([^&]+)\b/
        )
    )
);

export default function configureStore(initialState) {
    const store = createStore(rootReducer, initialState, enhancer);

    if (module.hot) {
        module.hot.accept('../reducers', () =>
        store.replaceReducer(require('../reducers'))
    );
}

return store;
}
