import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import Select from 'react-select'
import {
  DateInput,
  IconButton,
  PromptMessage,
  TextInput,
  TinyEditor,
  getAvatarBaseUrl,
  searchContentAndReplaceWithTag,
  getLocalStorageItem,
  setLocalStorageItem
} from 'tracim_frontend_lib'
import { localStorageFieldIdBuilder } from '../helper.js'

const emptyCard = {
  title: '',
  description: '',
  assignmentList: [],
  bgColor: '',
  kickoff: '',
  deadline: '',
  freeInput: '',
  duration: '',
  progress: undefined,
  depends: [],
  finished: false
}

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

const DependencySelectOption = (props) => (
  <div
    ref={props.innerRef}
    className='CustomReactSelectOption'
    key={props.data.id}
    {...props.innerProps}
  >
    <span
      className='CustomReactSelectOption__dot'
      style={{ backgroundColor: props.data.bgColor }}
    />
    <span>{props.data.title}</span>
  </div>
)

const DependsGroupLabel = (props) => (
  <div
    ref={props.innerRef}
    key={props.label}
    {...props.innerProps}
  >
    <span>{props.label}</span>
  </div>
)

function KanbanCardEditor (props) {
  const [card, setCard] = useState(emptyCard)
  const [wasModified, setWasModified] = useState(false)

  useEffect(() => {
    const localStorageCardJson = getLocalStorageItem(
      props.content.content_type,
      props.content.content_id,
      props.content.workspace_id,
      localStorageFieldIdBuilder(props.card.id)
    )

    if (localStorageCardJson) {
      setCard(JSON.parse(localStorageCardJson))
    } else {
      updateCard({ ...emptyCard, bgColor: props.defaultBackgroundColor, ...props.card })
    }
  }, [props.card])

  useEffect(() => {
    setWasModified(props.wasModified || wasModified)
  }, [props.wasModified])

  const updateCard = (newCard) => {
    setCard(newCard)
    setLocalStorageItem(
      props.content.content_type,
      props.content.content_id,
      props.content.workspace_id,
      localStorageFieldIdBuilder(props.card.id),
      JSON.stringify(newCard)
    )
  }

  async function handleValidate (e) {
    e.preventDefault()

    const descriptionWithContentLink = await searchContentAndReplaceWithTag(props.apiUrl, card.description)

    console.debug('%c<KanbanCardEditor> validate the form', 'color: gold', card)
    props.onValidate({
      ...card,
      description: descriptionWithContentLink.html,
      duration: `${card.duration}`,
      id: props.card.id
    })
  }

  function handleChangeSelectAssignment (newAssignmentList) {
    setCard({ ...card, assignmentList: newAssignmentList?.map(a => a.id) || [] })
  }

  function handleChangeSelectDepends (newDependsList) {
    setCard({ ...card, depends: newDependsList?.map(a => a.id) || [] })
  }

  function handleFinishedTask (e) {
    e.preventDefault()
    setCard({ ...card, finished: !card.finished })
  }

  const assignmentOptionList = props.memberList.map(m => ({
    ...m,
    value: m.id,
    label: m.publicName,
    avatarUrl: getAvatarBaseUrl(props.apiUrl, m.id)
  }))

  const selectedAssignmentOptionList = assignmentOptionList
    .filter(m => card.assignmentList.some(a => Number(a) === Number(m.id)))

  const dependsOptionList = [
    {
      label: props.column.title,
      options: props
        .cardsByColumns[props.column.id]
        .filter(c => c.id !== card.id)
        .map(m => ({
          ...m,
          value: m.id,
          label: m.title
        }))
    },
    {
      label: props.t('Other columns'),
      options: Object
        .entries(props.cardsByColumns)
        .filter((id) => id !== props.column.id)
        .flatMap(([id, cards]) => cards.map((card) => ({
          ...card,
          value: card.id,
          label: card.title
        })))
        .sort((first, second) => first.title > second.title)
    }
  ]

  const selectedDependsOptionList = card.depends.map((cardId) => {
    const cardData = props.cardsById[cardId]
    return {
      ...cardData,
      value: cardId,
      label: cardData.title
    }
  })

  return (
    <form className='kanban__KanbanPopup__form' onSubmit={handleValidate}>
      {wasModified && (
        <PromptMessage
          btnLabel={<i className='fas fa-times' />}
          btnType='link'
          icon='fas fa-exclamation'
          msg={
            <span>
              {props.t('This content has been modified.')}
              <button
                className='btn buttonLink'
                onClick={(e) => {
                  e.preventDefault()
                  props.onClickReloadModification(props.card.id)
                  setWasModified(false)
                }}
              >
                {props.t('Reload it!')}
              </button>
            </span>
          }
          noInlineMargins
          onClickBtn={(e) => {
            e.preventDefault()
            props.onClickIgnoreModification()
            setWasModified(false)
          }}
          tooltip={props.t('If you still want to use your current work, simply check the cross and the validation will be restored.')}
        />
      )}
      <div className='kanban__KanbanPopup__form__fields'>
        <div className='kanban__KanbanPopup__title'>
          <TextInput
            autoFocus
            id='kanban__KanbanPopup__title'
            onChange={(e) => updateCard({ ...card, title: e.target.value })}
            onValidate={handleValidate}
            value={card.title}
            placeholder={props.t('Title')}
          />
        </div>

        <div className='kanban__KanbanPopup__description'>
          <TinyEditor
            apiUrl={props.apiUrl}
            setContent={(description) => updateCard({ ...card, description })}
            // End of required props ///////////////////////////////////////////////////////////////
            codeLanguageList={props.codeLanguageList}
            content={card.description}
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
            value={selectedAssignmentOptionList}
            isMulti
            components={{ Option: CustomReactSelectOption }}
          />
        </div>

        <div className='kanban__KanbanPopup__inline'>
          <div className='kanban__KanbanPopup__inline__column'>
            <div className='kanban__KanbanPopup__kickoff inlineInput'>
              <label htmlFor='kanban__KanbanPopup__kickoff'>{props.t('Start date:')}</label>

              <DateInput
                id='kanban__KanbanPopup__kickoff'
                onChange={(e) => updateCard({ ...card, kickoff: e.target.value })}
                onValidate={handleValidate}
                value={card.kickoff}
              />
            </div>

            <div className='kanban__KanbanPopup__deadline inlineInput'>
              <label htmlFor='kanban__KanbanPopup__deadline'>{props.t('Due date:')}</label>

              <DateInput
                id='kanban__KanbanPopup__deadline'
                onChange={(e) => updateCard({ ...card, deadline: e.target.value })}
                onValidate={handleValidate}
                value={card.deadline}
              />
            </div>
          </div>

          <div className='kanban__KanbanPopup__inline__column'>
            <div className='kanban__KanbanPopup__duration inlineInput'>
              <label htmlFor='kanban__KanbanPopup__duration'>{props.t('Duration:')}</label>

              <TextInput
                id='kanban__KanbanPopup__duration'
                inputClassName='number'
                onChange={(e) => updateCard({ ...card, duration: e.target.value })}
                placeholder='1'
                value={card.duration ? `${card.duration}` : ''}
                suffix={card.duration > 1 ? props.t('days') : props.t('day')}
              />
            </div>

            <div className='kanban__KanbanPopup__progress inlineInput'>
              <label htmlFor='kanban__KanbanPopup__progress'>{props.t('Progress:')}</label>

              <TextInput
                id='kanban__KanbanPopup__progress'
                inputClassName='number'
                onChange={(e) => updateCard({ ...card, progress: e.target.value })}
                value={card.finished ? '100' : (card.progress || '')}
                placeholder='0'
                disabled={card.finished}
                suffix='%'
              />

              {card.finished ? (
                <div className='kanban__KanbanPopup__revert'>
                  <span>{props.t('Reopen')}</span>
                  <IconButton
                    customClass='kanban__KanbanPopup__revert__button'
                    color={props.customColor}
                    icon='fas fa-pen'
                    onClick={handleFinishedTask}
                    title={props.t('Reopen the card')}
                  />
                </div>
              ) : (
                <IconButton
                  color={props.customColor}
                  customClass='kanban__KanbanPopup__finished'
                  icon='fas fa-check'
                  onClick={handleFinishedTask}
                  text={props.t('Finished')}
                  title={props.t('Mark the card as finished')}
                />
              )}
            </div>
          </div>
        </div>

        <div className='kanban__KanbanPopup__depends inlineInput'>
          <label htmlFor='kanban__KanbanPopup__depends'>{props.t('Depends on:')}</label>

          <Select
            id='kanban__KanbanPopup__depends'
            className='kanban__KanbanPopup__depends__select select'
            components={{ Option: DependencySelectOption }}
            formatGroupLabel={DependsGroupLabel}
            isSearchable
            placeholder={props.t('No card')}
            onChange={handleChangeSelectDepends}
            options={dependsOptionList}
            noOptionsMessage={() => props.t('No card')}
            value={selectedDependsOptionList}
            isMulti
          />
        </div>

        <div className='kanban__KanbanPopup__inline'>
          <div className='kanban__KanbanPopup__bgColor'>
            <input
              id='kanban__KanbanPopup__bgColor'
              type='color'
              value={card.bgColor || props.defaultBackgroundColor}
              onChange={(e) => updateCard({ ...card, bgColor: e.target.value })}
            />
          </div>

          <div className='kanban__KanbanPopup__freeInput'>
            <TextInput
              id='kanban__KanbanPopup__freeInput'
              onChange={(e) => updateCard({ ...card, freeInput: e.target.value })}
              onValidate={handleValidate}
              value={card.freeInput}
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
          disabled={wasModified}
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
  cardsByColumns: PropTypes.object.isRequired,
  cardsById: PropTypes.object.isRequired,
  column: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onClickIgnoreModification: PropTypes.func.isRequired,
  onClickReloadModification: PropTypes.func.isRequired,
  defaultBackgroundColor: PropTypes.string.isRequired,
  // End of required props /////////////////////////////////////////////////////////////////////////
  codeLanguageList: PropTypes.array,
  customColor: PropTypes.string,
  language: PropTypes.string,
  memberList: PropTypes.array,
  wasModified: PropTypes.bool
}

KanbanCardEditor.defaultProps = {
  codeLanguageList: [],
  customColor: '',
  language: 'en',
  memberList: [],
  wasModified: false
}
