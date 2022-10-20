import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import appFactory from '../util/appFactory'
import PropTypes from 'prop-types'
import { CUSTOM_EVENT } from 'tracim_frontend_lib/src'

const CustomToolboxContainer = (props) => {
  useEffect(() => {
    props.dispatchCustomEvent(CUSTOM_EVENT.TRACIM_COMP_MOUNTED('TOOLBOX'), {
      lang: props.user.lang,
      parentName: props.parentName
    })

    return () => {
      props.dispatchCustomEvent(CUSTOM_EVENT.TRACIM_COMP_UNMOUNTED('TOOLBOX'), {
        lang: props.user.lang,
        parentName: props.parentName
      })
    }
  }, [])

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
