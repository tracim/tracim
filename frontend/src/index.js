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

// NOTE - SGD - 2022-12-30 - Taken from https://web.dev/vitals/
const postMetric = metric => {
  const blob = new Blob([JSON.stringify(metric)], { type: 'application/json' })
  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`.
  console.log('MONITORING SEND METRIC', metric)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics', blob)
  } else {
    fetch('/api/metrics', { body: blob, method: 'POST', keepalive: true })
  }
}

/**
 * MetricsProvider provides Matomo hooks for children components
 * and it tracks page views on location change.
 *
 * It should be embedded within <Router>
 */
export const MetricsProvider = ({ children }) => {
  // FIXME - SGD - 2022-12-30 - Find a way to parametrize the matomo server (and configuration?)
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
    const path = location.pathname
    const pageEntryTime = performance.now()
    let lastEntry = null
    let pageExitTime = null

    const sendIrreIfAvailableAndDisconnect = observer => {
      if (pageExitTime) {
        if (lastEntry) {
          postMetric({
            name: 'irre',
            value: 1e-3 * (lastEntry.responseEnd - pageEntryTime),
            labels: [path]
          })
          observer.disconnect()
        }
      }
    }

    // INFO - SGD - 2022-12-30 - An entry is initial if:
    // - its start time is less than 1 second after pageEntryTime
    // - its start time is less than pageExitTime if defined
    const isInitialEntry = entry => {
      return (
        entry.startTime < pageEntryTime + 1000 &&
        (!pageExitTime || entry.startTime < pageExitTime)
      )
    }

    console.log('MONITORING START', path, pageEntryTime)
    // TODO - SGD - 2022-12-30 - The computation could be improved:
    // - initial requests made after 1s are not taken into account
    const observer = new PerformanceObserver(list => {
      console.log('MONITORING OBSERVER', observer, list)
      const initialEntries = list.getEntries().filter(isInitialEntry)
      const last = initialEntries[initialEntries.length - 1]
      lastEntry = last || lastEntry
      sendIrreIfAvailableAndDisconnect(observer)
    })
    observer.observe({ entryTypes: ['resource'] })

    return () => {
      pageExitTime = performance.now()
      console.log('MONITORING END', path, pageEntryTime, pageExitTime, lastEntry)
      sendIrreIfAvailableAndDisconnect(observer)
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
      <MetricsProvider>
        <I18nextProvider i18n={i18n}>
          <DragDropContextProvider backend={HTML5Backend}>
            <Tracim />
          </DragDropContextProvider>
        </I18nextProvider>
      </MetricsProvider>
    </Router>
  </Provider>
  , document.getElementById('content')
)
