import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import ComposedIcon from '../Icon/ComposedIcon.jsx'

class PopinFixedHeader extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      editTitle: false,
      editTitleValue: props.rawTitle
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.rawTitle !== this.props.rawTitle) this.setState({ editTitleValue: this.props.rawTitle })
  }

  onChangeTitle = e => {
    const newTitle = e.target.value
    this.setState({ editTitleValue: newTitle })
  }

  handleClickChangeTitleBtn = () => {
    const { props, state } = this
    if (state.editTitle) {
      props.onValidateChangeTitle(state.editTitleValue)
      this.setState(prevState => ({ editTitle: !prevState.editTitle }))
      return
    }

    this.setState(prevState => ({
      editTitle: !prevState.editTitle,
      editTitleValue: props.rawTitle
    }))
  }

  handleClickUndoChangeTitleBtn = () => {
    this.setState({
      editTitle: false,
      editTitleValue: this.props.rawTitle
    })
  }

  handleInputKeyPress = e => {
    switch (e.key) {
      case 'Enter': this.handleClickChangeTitleBtn(); break
      case 'Escape': this.handleClickUndoChangeTitleBtn(); break
    }
  }

  render () {
    const { customClass, customColor, faIcon, rawTitle, componentTitle, userRoleIdInWorkspace, onClickCloseBtn, disableChangeTitle, hideChangeTitleButton, t } = this.props
    const { state } = this

    return (
      <div className={classnames('wsContentGeneric__header', `${customClass}__header`)} style={{ backgroundColor: customColor }}>
        <div className={classnames('wsContentGeneric__header__icon', `${customClass}__header__icon`)}>
          <i className={`fa fa-${faIcon}`} />
        </div>

        <div
          className={classnames('wsContentGeneric__header__title', `${customClass}__header__title`)}
          title={rawTitle}
        >
          {state.editTitle
            ? <input
              className='wsContentGeneric__header__title__editiontitle editiontitle'
              value={state.editTitleValue}
              onChange={this.onChangeTitle}
              onKeyDown={this.handleInputKeyPress}
            />
            : componentTitle
          }
        </div>

        {userRoleIdInWorkspace >= 2 && state.editTitle &&
          <button
            className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle iconBtn`)}
            onClick={this.handleClickUndoChangeTitleBtn}
            disabled={disableChangeTitle}
          >
            <i className='fa fa-undo' title={t('Undo change in title')} />
          </button>
        }

        {userRoleIdInWorkspace && !hideChangeTitleButton >= 2 &&
          <button
            className={classnames('wsContentGeneric__header__edittitle', `${customClass}__header__changetitle iconBtn`)}
            onClick={this.handleClickChangeTitleBtn}
            disabled={disableChangeTitle}
          >
            {state.editTitle ? <i className='fa fa-check' title={t('Validate the title')} /> : <i className='fa fa-pencil' title={t('Edit title')} />}
          </button>
        }

        <div
          className={classnames('wsContentGeneric__header__close', `${customClass}__header__close iconBtn`)}
          onClick={onClickCloseBtn}
          data-cy='popinFixed__header__button__close'
        >
          <i className='fa fa-times' />
        </div>
      </div>
    )
  }
}

export default translate()(PopinFixedHeader)

PopinFixedHeader.propTypes = {
  faIcon: PropTypes.string.isRequired,
  onClickCloseBtn: PropTypes.func.isRequired,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  rawTitle: PropTypes.string,
  componentTitle: PropTypes.element,
  userRoleIdInWorkspace: PropTypes.number,
  onValidateChangeTitle: PropTypes.func,
  disableChangeTitle: PropTypes.bool,
  hideChangeTitleButton: PropTypes.bool
}

PopinFixedHeader.defaultProps = {
  customClass: '',
  customColor: '',
  rawTitle: '',
  componentTitle: <div />,
  userRoleIdInWorkspace: 1,
  onChangeTitle: () => {},
  disableChangeTitle: false,
  hideChangeTitleButton: false
}
