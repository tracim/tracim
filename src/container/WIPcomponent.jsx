import React from 'react'
import { connect } from 'react-redux'
import ProgressBar from './ProgressBar.jsx'
import Home from './Home.jsx'

export class WIPcomponent extends React.Component {
  render () {
    const MyComponent = {
      ProgressBar,
      Home
    }

    // this.props.dispatch(newFlashMessage('TEST', 'info', 0))

    const ComponentToDisplay = MyComponent[this.props.match.params.cp]

    return (
      <div>
        <ComponentToDisplay />
      </div>
    )
  }
}

const mapStateToProps = () => ({})
export default connect(mapStateToProps)(WIPcomponent)
