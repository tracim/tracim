import { createStore, applyMiddleware, compose } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import rootReducer from './reducer/root.js'
// import createSagaMiddleware from 'redux-saga'
// import rootSaga from './saga.js'

// const sagaMiddleware = createSagaMiddleware()

export const store = createStore(
  rootReducer,
  compose(
    applyMiddleware(thunkMiddleware, /* sagaMiddleware, */ createLogger()),
    (window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()) || (f => f)
  )
)

// sagaMiddleware.run(rootSaga)
