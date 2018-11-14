import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import color from 'color'
import PreviewComponent from './PreviewComponent.jsx'
import { MODE } from '../helper.js'
import FileDropzone from './FileDropzone.jsx'
import PopupProgressUpload from './PopupProgressUpload.jsx'

export const FileComponent = props =>
  <div className={classnames('file__contentpage__statewrapper', {'displayState': props.isArchived || props.isDeleted})}>
    {props.isArchived &&
      <div className='file__contentpage__preview__state'>
        <div className='file__contentpage__preview__state__msg'>
          <i className='fa fa-fw fa-archive' />
          {props.t('This content is archived.')}
        </div>

        <button className='file__contentpage__preview__state__btnrestore btn' onClick={props.onClickRestoreArchived}>
          <i className='fa fa-fw fa-archive' />
          {props.t('Restore')}
        </button>
      </div>
    }

    {props.isDeleted &&
      <div className='file__contentpage__preview__state'>
        <div className='file__contentpage__preview__state__msg'>
          <i className='fa fa-fw fa-trash' />
          {props.t('This content is deleted.')}
        </div>

        <button className='file__contentpage__preview__state__btnrestore btn' onClick={props.onClickRestoreDeleted}>
          <i className='fa fa-fw fa-trash' />
          {props.t('Restore')}
        </button>
      </div>
    }

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
        displayChangeDescriptionBtn={props.loggedUser.idRoleUserWorkspace >= 2}
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
            className='file__contentpage__dropzone__btn__cancel btn outlineTextBtn'
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
