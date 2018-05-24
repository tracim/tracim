import React from 'react'
import { connect } from 'react-redux'
import PopupCreateContainer from '../component/PopupCreateContent/PopupCreateContainer.jsx'
import ProgressBar from './ProgressBar.jsx'
import Home from './Home.jsx'
import CardPopup from '../component/common/CardPopup/CardPopup.jsx'

export class WIPcomponent extends React.Component {
  render () {
    const MyComponent = {
      PopupCreateContainer,
      ProgressBar,
      Home,
      CardPopup
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
