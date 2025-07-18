import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'
import { translate } from 'react-i18next'

export const TemplateContentSelector = props => {
  const noTemplateValue = { label: props.t('No model'), value: null }
  const optionList = [
    { label: '', options: [noTemplateValue] },
    ...props.templateList
  ]
  const selectedGroup = optionList.find(group => group.options.some(template => template.value === props.templateId))
  const selectedValue = selectedGroup?.options.find(template => template.value === props.templateId)

  return (
    <div className='TemplateContentSelector'>
      <div className='TemplateContentSelector__label'>
        {props.t('Use model:')}
      </div>

      <Select
        className='TemplateContentSelector__templateList'
        isClearable
        isSearchable
        onChange={props.onChangeTemplate}
        options={optionList}
        value={selectedValue}
        defaultValue={noTemplateValue}
      />
    </div>
  )
}

export default translate()(TemplateContentSelector)

TemplateContentSelector.propTypes = {
  onChangeTemplate: PropTypes.func.isRequired,
  templateList: PropTypes.array.isRequired,
  templateId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

TemplateContentSelector.defaultProps = {
  templateId: null
}
