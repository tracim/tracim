import React from 'react'
import { connect } from 'react-redux'
import appFactory from '../util/appFactory'
import PropTypes from 'prop-types'
import { usePublishLifecycle } from 'tracim_frontend_lib'

const CustomToolboxContainer = (props) => {
  usePublishLifecycle('TOOLBOX', {
    lang: props.user.lang,
    parentName: props.parentName
  }, props.dispatchCustomEvent)

  return (
    <div id={`customToolbox__${props.parentName}`}>
      <div
        id='customToolboxHeaderBtn'
        className='header__menu__rightside__specificBtn'
      />
    </div>
  )
}

CustomToolboxContainer.propsType = {
  parentName: PropTypes.string
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(appFactory(CustomToolboxContainer))
