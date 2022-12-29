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
import { MatomoProvider, createInstance } from '@jonkoops/matomo-tracker-react'
import { useLocation } from 'react-router'

require('./css/index.styl')

require('./util/appInterface.js')
require('./util/tinymceInit.js')

/**
 * MatomoRouterProvider provides Matomo hooks for children components
 * and it tracks page views on location change.
 *
 * It should be embedded within <Router>
 */
export const MatomoRouterProvider = ({children}) => {
  const instance = createInstance({
    urlBase: 'http://localhost:8080',
    siteId: 1,
    disabled: false, // optional, false by default. Makes all tracking calls no-ops if set to true.
    heartBeat: { // optional, enabled by default
      active: true, // optional, default value: true
      seconds: 10 // optional, default value: `15
    },
    linkTracking: false, // optional, default value: true
    configurations: { // optional, default value: {}
      // any valid matomo configuration, all below are optional
      disableCookies: true,
      setSecureCookie: false,
      setRequestMethod: 'POST'
    }
  })

  const location = useLocation()
  React.useEffect(() => { instance.trackPageView() }, [location])

  React.useEffect(() => {
    let startTime = performance.now()
    let lastEntry = null
    const observer = new PerformanceObserver(list => {
      const perfEntries = list.getEntries().filter(entry => entry.startTime < startTime + 1000)
      const last = perfEntries[perfEntries.length - 1]
      lastEntry = last || lastEntry
    })
    observer.observe({entryTypes: ['resource']});

    return () => {
      if (lastEntry) {
        instance.trackEvent({
          category: 'Performance',
          action: 'IRRE',
          name: location.pathname,
          value: lastEntry.responseEnd - startTime
        })
      }
      observer.disconnect()
    }
  }, [location])

  return (
    <MatomoProvider value={instance}>
      {children}
    </MatomoProvider>
  )
}

ReactDOM.render(
    <Provider store={store}>
      <Router history={history}>
        <MatomoRouterProvider>
          <I18nextProvider i18n={i18n}>
            <DragDropContextProvider backend={HTML5Backend}>
              <Tracim />
            </DragDropContextProvider>
          </I18nextProvider>
        </MatomoRouterProvider>
      </Router>
    </Provider>
  , document.getElementById('content')
)
