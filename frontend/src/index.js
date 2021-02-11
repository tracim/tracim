import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { Provider } from 'react-redux'
import { store } from './store.js'
import Tracim from './container/Tracim.jsx'
import { Router } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './util/i18n.js'
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { history } from './util/helper.js'

require('./css/index.styl')

require('./util/appInterface.js')
require('./util/tinymceInit.js')

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <I18nextProvider i18n={i18n}>
        <DragDropContextProvider backend={HTML5Backend}>
          <Tracim />
        </DragDropContextProvider>
      </I18nextProvider>
    </Router>
  </Provider>
  , document.getElementById('content')
)
