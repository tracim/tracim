import React from 'react'
import { connect } from 'react-redux'
import Home from './Home.jsx'

export class WIPcomponent extends React.Component {
  render () {
    const MyComponent = {
      Home
    }

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
