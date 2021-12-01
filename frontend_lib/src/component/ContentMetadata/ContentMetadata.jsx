import React, { useState, useEffect } from 'react'
import { translate } from 'react-i18next'

import { handleFetchResult } from '../../helper.js'
import { getRawFileContent } from '../../action.async.js'

import Loading from '../Loading/Loading.jsx'
import CustomFormManager from '../JSONSchemaForms/CustomFormManager.jsx'

function ContentMetadata (props) {
  const [schema, setSchema] = useState(null)
  const [uiSchema, setUiSchema] = useState(null)

  useEffect(() => {
    if (!props.content.content_metadata) {
      setSchema(null)
      setUiSchema(null)
      return
    }

    (async function fetchData () {
      const [fetchSchema, fetchUISchema] = await Promise.all([
        handleFetchResult(
          await getRawFileContent(
            props.apiUrl,
            props.content.metadata_schema.workspace_id,
            props.content.metadata_schema.content_id,
            props.content.metadata_schema.current_revision_id,
            'schema.json'
          ),
          true
        ),

        handleFetchResult(
          await getRawFileContent(
            props.apiUrl,
            props.content.metadata_ui_schema.workspace_id,
            props.content.metadata_ui_schema.content_id,
            props.content.metadata_ui_schema.current_revision_id,
            'uischema.json'
          ),
          true
        )
      ])

      if (fetchSchema.apiResponse.ok && fetchUISchema.apiResponse.ok) {
        setSchema(fetchSchema.body)
        setUiSchema(fetchUISchema.body)
      }
    }())
  }, [props.content.revision_id])

  return (schema && uiSchema) ? (
    <CustomFormManager
      schemaObject={schema}
      uiSchemaObject={uiSchema}
      dataSchemaObject={props.content.content_metadata}
    />
  ) : (
    props.content.content_metadata
      ? <Loading />
      : props.t('No metadata are attached to this file.')
  )
}

export default translate()(ContentMetadata)
