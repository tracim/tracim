import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PreviewComponent from './PreviewComponent.jsx'
import { MODE } from '../helper.js'
import FileDropzone from './FileDropzone.jsx'

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

    {props.mode === MODE.VIEW &&
      <PreviewComponent
        onClickDownloadRaw={props.onClickDownloadRaw}
        onClickDownloadPdfPage={props.onClickDownloadPdfPage}
        onClickDownloadPdfFull={props.onClickDownloadPdfFull}
        previewFile={props.previewFile}
        displayProperty={props.displayProperty}
        onClickProperty={props.onClickProperty}
        description={props.description}
      />
    }

    {props.mode === MODE.EDIT &&
      <div className='file__contentpage__dropzone'>
        <FileDropzone
          onDrop={props.onChangeFile}
          onClick={props.onChangeFile}
          hexcolor={props.customColor}
        />

        <div className='file__contentpage__dropzone__btn'>
          <button
            type='button'
            className='file__contentpage__dropzone__btn__cancel'
            onClick={props.onClickDropzoneCancel}
          >
            {props.t('Cancel')}
          </button>

          <button
            type='button'
            className='file__contentpage__dropzone__btn__validate'
            onClick={props.onClickDropzoneValidate}
          >
            {props.t('Validate')}
          </button>
        </div>
      </div>
    }
  </div>

export default translate()(FileComponent)
