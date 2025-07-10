import ReactDOM from 'react-dom'
import 'regenerator-runtime/runtime'
import { Router } from 'react-router-dom'
import Agenda from './container/Agenda'
import { debug } from './debug'
import { LiveMessageManager } from 'tracim_frontend_lib'
import { createBrowserHistory } from 'history'

require('./css/index.styl')

// INFO - CH - 2020-01-12 - Router is required because we have <Link> in <PageTitle> component
const history = createBrowserHistory()

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <Agenda
      // HACK - CJ - 2025-07-03 - Agenda was originally made in js and its props are not declared
      // @ts-expect-error see HACK comment above
      data={undefined}
    />
  </Router>
  , document.getElementById('content')
)
