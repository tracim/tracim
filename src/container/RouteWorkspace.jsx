import React from 'react'
import {PAGE} from '../helper.js'
import WorkspaceContent from './WorkspaceContent.jsx'
import Dashboard from './Dashboard.jsx'

// dunno why i would need this, but, at the time, it sounded a good idea

class RouteWorkspace extends React.Component {
  render () {
    return (
      <Switch>
        <PrivateRoute path={PAGE.WORKSPACE.DASHBOARD(':idws')} component={Dashboard} />
        <PrivateRoute path={PAGE.WORKSPACE.CALENDAR(':idws')} component={() => <div><br /><br /><br /><br />NYI</div>} />
        <PrivateRoute path={PAGE.WORKSPACE.CONTENT(':idws', ':type?', ':idcts?')} component={WorkspaceContent} />
      </Switch>
    )
  }
}

export default RouteWorkspace
