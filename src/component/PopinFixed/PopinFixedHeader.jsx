import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

class PopinFixedHeader extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      editTitle: false
    }
  }

  handleClickChangeTitleBtn = () => this.setState(prevState => ({
    editTitle: !prevState.editTitle
  }))

  render () {
    const { customClass, icon, name, onChangeTitle, onClickCloseBtn } = this.props

    return (
      <div className={classnames('wsContentGeneric__header', `${customClass}__header`)}>
        <div className={classnames('wsContentGeneric__header__icon', `${customClass}__header__icon`)}>
          <i className={icon} />
        </div>

        <div className={classnames('wsContentGeneric__header__title mr-auto', `${customClass}__header__title`)}>
          {this.state.editTitle === false &&
            <div>
              {name}
            </div>
          }
          {this.state.editTitle === true &&
            <input onChange={onChangeTitle} />
          }
        </div>

        <div
          className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle`)}
          onClick={this.handleClickChangeTitleBtn}
        >
          <i className='fa fa-pencil' />
        </div>

        <div
          className={classnames('wsContentGeneric__header__close', `${customClass}__header__close`)}
          onClick={onClickCloseBtn}
        >
          <i className='fa fa-times' />
        </div>
      </div>
    )
  }
}

export default PopinFixedHeader

PopinFixedHeader.propTypes = {
  icon: PropTypes.string.isRequired,
  onClickCloseBtn: PropTypes.func.isRequired,
  customClass: PropTypes.string,
  name: PropTypes.string,
  onChangeTitle: PropTypes.func
}

PopinFixedHeader.defaultProps = {
  customClass: '',
  name: '',
  onChangeTitle: () => {}
}
