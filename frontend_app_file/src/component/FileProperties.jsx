import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import { IconButton, PromptMessage } from 'tracim_frontend_lib'

const color = require('color')

require('./FileProperties.styl')

export class FileProperties extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      displayFormNewDescription: false,
      newDescription: ''
    }
  }

  handleToggleFormNewDescription = () => this.setState(prev => ({
    displayFormNewDescription: !prev.displayFormNewDescription,
    newDescription: this.props.description
  }))

  handleChangeDescription = e => this.setState({ newDescription: e.target.value })

  handleClickValidateNewDescription = () => {
    this.props.onClickValidateNewDescription(this.state.newDescription)
    this.setState({ displayFormNewDescription: false })
  }

  render () {
    const { props, state } = this

    return (
      <div className='fileProperties'>
        <div className='fileProperties__content'>
          <div className='fileProperties__content__detail'>
            <div className='fileProperties__content__detail__item'>
              {props.t('Type:')} {props.fileType}
            </div>

            <div className='fileProperties__content__detail__item'>
              {props.t('Size:')} {props.fileSize}
            </div>

            <div className='fileProperties__content__detail__item'>
              {props.t('Page number:')} {props.filePageNb}
            </div>

            <div className='fileProperties__content__detail__item'>
              {props.t('Number of shares:')} {props.activesShares}
            </div>

            <div className='fileProperties__content__detail__item' title={props.creationDateFormatted}>
              {props.t('Creation date:')} {props.creationDateFormattedWithTime}
            </div>

            <div className='fileProperties__content__detail__item' title={props.lastModificationFormatted}>
              {props.t('Last modification:')} {props.lastModification}
            </div>

            <div className='fileProperties__content__detail__description'>
              {props.t('Description:')}
            </div>
            {(state.displayFormNewDescription
              ? (
                <form className='fileProperties__content__detail__description__editiondesc'>
                  <textarea
                    value={state.newDescription}
                    onChange={this.handleChangeDescription}
                  />

                  {props.disableChangeDescription && (
                    <PromptMessage
                      msg={props.t("The file has been updated, it can't be edited anymore")}
                      icon='warning'
                    />
                  )}

                  <div className='fileProperties__content__detail__description__editiondesc__btn'>
                    <IconButton
                      customClass='fileProperties__content__detail__description__editiondesc__btn__cancel'
                      color={props.color}
                      intent='secondary'
                      onClick={this.handleToggleFormNewDescription}
                      icon='fas fa-times'
                      text={props.t('Cancel')}
                      key='cancelBtn'
                    />

                    <IconButton
                      customClass='fileProperties__content__detail__description__editiondesc__btn__validate'
                      color={props.color}
                      disabled={props.disableChangeDescription}
                      intent='primary'
                      mode='light'
                      onClick={this.handleClickValidateNewDescription}
                      icon='fas fa-check'
                      text={props.t('Validate')}
                      key='validateBtn'
                    />
                  </div>
                </form>
              )
              : (
                <div className='fileProperties__content__detail__description__text'>
                  {props.description}
                </div>
              )
            )}

            {props.displayChangeDescriptionBtn && !state.displayFormNewDescription && (
              <IconButton
                customClass='fileProperties__content__detail__btndesc'
                color={props.color}
                disabled={props.disableChangeDescription}
                intent='primary'
                mode='light'
                onClick={this.handleToggleFormNewDescription}
                icon='fas fa-edit'
                text={props.t('Change description')}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default translate()(Radium(FileProperties))
