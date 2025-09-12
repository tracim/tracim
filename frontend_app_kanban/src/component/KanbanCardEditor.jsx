import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import Select from 'react-select'
import {
  DateInput,
  IconButton,
  TextInput,
  TinyEditor,
  getAvatarBaseUrl,
  searchContentAndReplaceWithTag,
  getLocalStorageItem,
  setLocalStorageItem
} from 'tracim_frontend_lib'
import { localStorageFieldIdBuilder } from '../helper.js'

const CustomReactSelectOption = (props) => {
  return (
    <div
      ref={props.innerRef}
      className='CustomReactSelectOption'
      key={props.data.id}
      {...props.innerProps}
    >
      <div className='CustomReactSelectOption__avatar'>
        <img
          className='CustomReactSelectOption__avatar__img'
          src={`${props.data.avatarUrl}/preview/jpg/25x25/avatar`}
          alt=''
        />
      </div>

      <div>{props.data.publicName}</div>

      <div className='CustomReactSelectOption__username'>@{props.data.username}</div>
    </div>
  )
}

function KanbanCardEditor (props) {
  const { card } = props

  const cardFromLocalStorage = useMemo(() => {
    const localStorageCardJson = getLocalStorageItem(
      props.content.content_type,
      props.content.content_id,
      props.content.workspace_id,
      localStorageFieldIdBuilder(props.card.id)
    )
    if (localStorageCardJson) return JSON.parse(localStorageCardJson)

    return {
      title: null,
      description: null,
      assignmentList: null,
      bgColor: null,
      kickoff: null,
      deadline: null,
      freeInput: null
    }
  }, [])

  const [title, setTitle] = useState(cardFromLocalStorage.title || card.title || '')
  const [description, setDescription] = useState(cardFromLocalStorage.description || card.description || '')
  const [assignmentList, setAssignmentList] = useState(cardFromLocalStorage.assignmentList || card.assignmentList || [])
  const [bgColor, setBgColor] = useState(cardFromLocalStorage.bgColor || card.bgColor || props.defaultBackgroundColor)
  const [kickoff, setKickoff] = useState(cardFromLocalStorage.kickoff || card.kickoff || '')
  const [deadline, setDeadline] = useState(cardFromLocalStorage.deadline || card.deadline || '')
  const [freeInput, setFreeInput] = useState(cardFromLocalStorage.freeInput || card.freeInput || '')

  useEffect(() => {
    const kanbanCardDataJson = JSON.stringify({
      title, description, assignmentList, bgColor, kickoff, deadline, freeInput
    })

    setLocalStorageItem(
      props.content.content_type,
      props.content.content_id,
      props.content.workspace_id,
      localStorageFieldIdBuilder(props.card.id),
      kanbanCardDataJson
    )
  }, [title, description, assignmentList, bgColor, kickoff, deadline, freeInput])

  async function handleValidate (e) {
    e.preventDefault()

    const descriptionWithContentLink = await searchContentAndReplaceWithTag(props.apiUrl, description)

    props.onValidate({
      ...card,
      title,
      description: descriptionWithContentLink.html,
      assignmentList,
      bgColor,
      kickoff,
      deadline,
      freeInput
    })
  }

  function handleChangeSelectAssignment (newAssignmentList) {
    setAssignmentList(newAssignmentList?.map(a => a.id) || [])
  }

  const assignmentOptionList = props.memberList.map(m => ({
    ...m,
    value: m.id,
    label: m.publicName,
    avatarUrl: getAvatarBaseUrl(props.apiUrl, m.id)
  }))

  const selectedAssignmentOptionList = assignmentOptionList
    .filter(m => assignmentList.some(a => Number(a) === Number(m.id)))

  return (
    <form className='kanban__KanbanPopup__form' onSubmit={handleValidate}>
      <div className='kanban__KanbanPopup__form__fields'>
        <div className='kanban__KanbanPopup__title'>
          <TextInput
            autoFocus
            id='kanban__KanbanPopup__title'
            onChange={(e) => setTitle(e.target.value)}
            onValidate={handleValidate}
            value={title}
            placeholder={props.t('Title')}
          />
        </div>

        <div className='kanban__KanbanPopup__description'>
          <TinyEditor
            apiUrl={props.apiUrl}
            setContent={setDescription}
            // End of required props ///////////////////////////////////////////////////////////////
            codeLanguageList={props.codeLanguageList}
            content={description}
            height={300}
            isAdvancedEdition
            isMentionEnabled={false}
            language={props.language}
            maxHeight={350}
            userList={props.memberList}
            minHeight={250}
            placeholder={props.t('Description of the card')}
          />
        </div>

        <div className='kanban__KanbanPopup__assignment'>
          <Select
            id='kanban__KanbanPopup__assignment'
            className='kanban__KanbanPopup__assignment__select'
            isSearchable
            placeholder={props.t('Assignment')}
            onChange={handleChangeSelectAssignment}
            options={assignmentOptionList}
            noOptionsMessage={() => props.t('No member')}
            defaultValue={selectedAssignmentOptionList}
            isMulti
            components={{ Option: CustomReactSelectOption }}
          />
        </div>

        <div className='kanban__KanbanPopup__inline'>
          <div className='kanban__KanbanPopup__kickoff inlineInput'>
            <label htmlFor='kanban__KanbanPopup__kickoff'>{props.t('Start date:')}</label>

            <DateInput
              id='kanban__KanbanPopup__kickoff'
              onChange={(e) => setKickoff(e.target.value)}
              onValidate={handleValidate}
              value={kickoff}
            />
          </div>

          <div className='kanban__KanbanPopup__deadline inlineInput'>
            <label htmlFor='kanban__KanbanPopup__deadline'>{props.t('Due date:')}</label>

            <DateInput
              id='kanban__KanbanPopup__deadline'
              onChange={(e) => setDeadline(e.target.value)}
              onValidate={handleValidate}
              value={deadline}
            />
          </div>

          <div className='linebreak' />

          <div className='kanban__KanbanPopup__bgColor'>
            <input
              id='kanban__KanbanPopup__bgColor'
              type='color'
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
          </div>

          <div className='kanban__KanbanPopup__freeInput'>
            <TextInput
              id='kanban__KanbanPopup__freeInput'
              onChange={(e) => setFreeInput(e.target.value)}
              onValidate={handleValidate}
              value={freeInput}
              placeholder={props.t('Open field')}
            />
          </div>
        </div>
      </div>

      <div className='kanban__KanbanPopup__form_buttons'>
        <IconButton
          color={props.customColor}
          dataCy='confirm_popup__button_cancel'
          icon='fas fa-times'
          onClick={props.onCancel}
          text={props.t('Cancel')}
        />

        <IconButton
          color={props.customColor}
          dataCy='confirm_popup__button_confirm'
          icon='fas fa-check'
          intent='primary'
          mode='light'
          onClick={handleValidate}
          text={props.t('Validate')}
        />
      </div>
    </form>
  )
}
export default translate()(KanbanCardEditor)

KanbanCardEditor.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  content: PropTypes.object.isRequired,
  card: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  defaultBackgroundColor: PropTypes.string.isRequired,
  // End of required props /////////////////////////////////////////////////////////////////////////
  codeLanguageList: PropTypes.array,
  customColor: PropTypes.string,
  language: PropTypes.string,
  memberList: PropTypes.array
}

KanbanCardEditor.defaultProps = {
  codeLanguageList: [],
  customColor: '',
  language: 'en',
  memberList: []
}
