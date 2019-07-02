import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import color from 'color'
import PreviewComponent from './PreviewComponent.jsx'
import { MODE } from '../helper.js'
import PopupProgressUpload from './PopupProgressUpload.jsx'
import { DisplayState, FileDropzone } from 'tracim_frontend_lib'

export const FileComponent = props =>
  <div className={classnames('file__contentpage__statewrapper', {'displayState': props.isArchived || props.isDeleted})}>
    {props.isArchived && (
      <DisplayState
        msg={props.t('This content is archived')}
        btnType='button'
        icon='archive'
        btnLabel={props.t('Restore')}
        onClickBtn={props.onClickRestoreArchived}
      />
    )}

    {props.isDeleted && (
      <DisplayState
        msg={props.t('This content is deleted')}
        btnType='button'
        icon='trash'
        btnLabel={props.t('Restore')}
        onClickBtn={props.onClickRestoreDeleted}
      />
    )}

    {props.isDeprecated && (
      <DisplayState
        msg={props.t('This content is deprecated')}
        icon={props.deprecatedStatus.faIcon}
      />
    )}

    {(props.mode === MODE.VIEW || props.mode === MODE.REVISION) &&
      <PreviewComponent
        color={props.customColor}
        downloadRawUrl={props.downloadRawUrl}
        isPdfAvailable={props.isPdfAvailable}
        isJpegAvailable={props.isJpegAvailable}
        downloadPdfPageUrl={props.downloadPdfPageUrl}
        downloadPdfFullUrl={props.downloadPdfFullUrl}
        previewUrl={props.previewUrl}
        fileSize={props.fileSize}
        filePageNb={props.filePageNb}
        fileCurrentPage={props.fileCurrentPage}
        lightboxUrlList={props.lightboxUrlList}
        displayProperty={props.displayProperty}
        onClickProperty={props.onClickProperty}
        description={props.description}
        displayChangeDescriptionBtn={props.loggedUser.userRoleIdInWorkspace >= 2}
        disableChangeDescription={!props.isEditable}
        onClickPreviousPage={props.onClickPreviousPage}
        onClickNextPage={props.onClickNextPage}
        onClickValidateNewDescription={props.onClickValidateNewDescription}
      />
    }

    {props.mode === MODE.EDIT &&
      <div className='file__contentpage__dropzone'>
        {props.progressUpload.display &&
          <PopupProgressUpload
            color={props.customColor}
            percent={props.progressUpload.percent}
            filename={props.newFile ? props.newFile.name : ''}
          />
        }

        <FileDropzone
          onDrop={props.onChangeFile}
          onClick={props.onChangeFile}
          hexcolor={props.customColor}
          preview={props.newFilePreview}
          filename={props.newFile ? props.newFile.name : ''}
        />

        <div className='file__contentpage__dropzone__btn'>
          <button
            type='button'
            className='file__contentpage__dropzone__btn__cancel btn outlineTextBtn nohover'
            style={{borderColor: props.customColor}}
            onClick={props.onClickDropzoneCancel}
          >
            {props.t('Cancel')}
          </button>

          <button
            type='button'
            className='file__contentpage__dropzone__btn__validate btn highlightBtn'
            style={{
              backgroundColor: props.customColor,
              ':hover': {
                backgroundColor: color(props.customColor).darken(0.15).hexString()
              }
            }}
            onClick={props.onClickDropzoneValidate}
            disabled={props.newFile === ''}
          >
            {props.t('Validate')}
          </button>
        </div>
      </div>
    }
  </div>

export default translate()(Radium(FileComponent))
