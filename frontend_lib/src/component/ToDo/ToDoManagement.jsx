import React, { useEffect, useState } from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import IconButton from '../Button/IconButton.jsx'
import LinkButton from '../Button/LinkButton.jsx'
import ToDoItem, {
  isDeletable,
  isEditable
} from './ToDoItem.jsx'
import NewToDo from './NewToDo.jsx'
import { ROLE } from '../../helper.js'
import CreateToDoFromTextPopUp from './CreateToDoFromTextPopUp.jsx'

const ToDoManagement = (props) => {
  const isReader = props.user.userRoleIdInWorkspace === ROLE.reader.id
  const nobodyValueObject = { value: null, label: props.t('Nobody') }

  const [isPopUpDisplayed, setIsPopUpDisplayed] = useState(false)
  const [isNewToDo, setIsNewToDo] = useState(props.toDoList.length === 0 && !isReader)
  const [memberListOptions, setMemberListOptions] = useState([nobodyValueObject])
  const [newToDoList, setNewToDoList] = useState([])
  const [newToDoListAsText, setNewToDoListAsText] = useState('')
  const [newToDoListSave, setNewToDoListSave] = useState([])
  const [selectedValueList, setSelectedValueList] = useState([nobodyValueObject])

  useEffect(() => {
    const memberList = props.memberList.filter(member => member.username)
    const formattedMemberList = memberList.map(member => ({ value: member.id, label: `${member.publicName} (${member.username})` }))
    setMemberListOptions([nobodyValueObject, ...formattedMemberList])
  }, [props.memberList])

  useEffect(() => {
    setNewToDoList([{
      assigneeId: null,
      value: null
    }])
  }, [isNewToDo])

  useEffect(() => {
    if (!isPopUpDisplayed) {
      let text = ''
      newToDoList.forEach((newToDo, index) => {
        if (index !== 0) {
          text = text.concat('\n')
        }
        if (newToDo.value) {
          if (newToDo.assigneeId) {
            const assignee = props.memberList.find(member => member.id === newToDo.assigneeId)
            text = text.concat(`+${assignee.username} `)
          }
          text = text.concat(`${newToDo.value}`)
        }
      })
      setNewToDoListAsText(text)
    }
  }, [newToDoList])

  const addTodo = () => {
    const tmpToDoList = [...newToDoList]
    const tmpSelectedValueList = [...selectedValueList]

    tmpToDoList.push(
      {
        assigneeId: null,
        value: null
      }
    )
    tmpSelectedValueList.push(nobodyValueObject)

    setSelectedValueList(tmpSelectedValueList)
    setNewToDoList(tmpToDoList)
  }

  const handleClickCancel = () => setIsNewToDo(false)

  const handleClickClose = () => {
    setNewToDoList(newToDoListSave)
    setIsPopUpDisplayed(false)
  }

  const handleClickSaveToDo = () => {
    newToDoList.forEach(newToDo => {
      if (newToDo.value) {
        if (newToDo.assigneeId === 0) {
          props.onClickSaveNewToDo(null, newToDo.value)
        } else {
          props.onClickSaveNewToDo(newToDo.assigneeId, newToDo.value)
        }
      }
    })
    setIsPopUpDisplayed(false)
    setIsNewToDo(false)
  }

  const handleChangeSelectedValue = (e, index) => {
    const tmpToDoList = [...newToDoList]
    const tmpSelectedValueList = [...selectedValueList]

    tmpToDoList[index].assigneeId = e.value
    tmpSelectedValueList[index] = e

    setSelectedValueList(tmpSelectedValueList)
    setNewToDoList(tmpToDoList)
  }

  const handleChangeValue = (e, index) => {
    const tmpToDoList = [...newToDoList]
    tmpToDoList[index].value = e.target.value
    setNewToDoList(tmpToDoList)
  }

  const handleChangePopUpValue = (e) => {
    setNewToDoListAsText(e.target.value)

    const lines = e.target.value.split(/\n/g)
    const tmpToDoList = []
    const tmpSelectedValueList = [...selectedValueList]

    lines.forEach((line, index) => {
      // INFO - MP - 2022-07-04 - This regex will:
      // Look for a +<UserName> followed by the ToDo text
      // Ignoring blank space before the + and between the UserName and the ToDo text
      // Example:
      // With the string: '  +mathis do this'
      // The expression will return: match['  ', '+mathis do this', '+mathis', ' ', 'do this']
      // With the string: 'you have to do this'
      // The expression will return: match['you have to do this', undefined, undefined, undefined, 'you have to do this']
      const toDoGroups = line.match(/^([\s]*)([+][a-zA-Z]*)?( +)?(.*)/)

      if (toDoGroups) {
        let toDoAssigneeUsername

        if (toDoGroups[2] && toDoGroups[2].startsWith('+')) {
          toDoAssigneeUsername = toDoGroups[2].substring(1)
        }

        const toDoAssignee = props.memberList.find(member => member.username && member.username === toDoAssigneeUsername)

        if (toDoAssignee) {
          tmpSelectedValueList[index] = memberListOptions.find(option => option.value === toDoAssignee.id)
        } else {
          tmpSelectedValueList[index] = nobodyValueObject
        }

        tmpToDoList.push(
          {
            assigneeId: tmpSelectedValueList[index] ? tmpSelectedValueList[index].value : null,
            value: toDoGroups[4]
          }
        )
      }
    })
    setSelectedValueList([...tmpSelectedValueList])
    setNewToDoList([...tmpToDoList])
  }

  const handleOpenPopUp = () => {
    setNewToDoListSave(newToDoList)
    setIsPopUpDisplayed(true)
  }

  return (
    <div className='toDoManagement'>
      {isNewToDo ? (
        <div className='toDoManagement__creation'>
          <div className='toDoManagement__creation__linkButton'>
            <LinkButton
              onClick={handleOpenPopUp}
              text={props.t('Create from text')}
            />
          </div>

          {newToDoList.map((toDo, index) => {
            return (
              <NewToDo
                apiUrl={props.apiUrl}
                onChangeSelectedValue={(e) => handleChangeSelectedValue(e, index)}
                onChangeValue={(e) => handleChangeValue(e, index)}
                contentId={props.contentId}
                customColor={props.customColor}
                key={`todoList__${index}`}
                memberListOptions={memberListOptions}
                selectedValue={selectedValueList[index]}
                value={toDo.value ? toDo.value : ''}
              />
            )
          })}

          <div className='toDoManagement__buttons'>

            <IconButton
              icon='fas fa-plus'
              onClick={addTodo}
              color={props.customColor}
            />

            <div className='toDoManagement__buttons__new'>
              <IconButton
                text={props.t('Cancel')}
                icon='fas fa-times'
                onClick={handleClickCancel}
                color={props.customColor}
                intent='secondary'
              />

              <IconButton
                text={props.t('Validate')}
                icon='fas fa-check'
                onClick={handleClickSaveToDo}
                color={props.customColor}
                intent='primary'
                mode='light'
              />
            </div>

          </div>
        </div>
      ) : (
        <div className='toDo'>
          {!isReader && (
            <IconButton
              color={props.customColor}
              customClass='toDo__newButton'
              icon='fas fa-plus-circle'
              intent='primary'
              mode='light'
              onClick={() => setIsNewToDo(true)}
              text={props.t('New task')}
            />
          )}
          {props.toDoList.length > 0
            ? props.toDoList.map(toDo =>
              <ToDoItem
                key={`toDo_${toDo.content_id}`}
                isDeletable={isDeletable(toDo, props.user, props.user.userRoleIdInWorkspace)}
                isEditable={isEditable(toDo, props.user, props.user.userRoleIdInWorkspace)}
                memberList={props.memberList}
                onClickChangeStatusToDo={props.onClickChangeStatusToDo}
                onClickDeleteToDo={props.onClickDeleteToDo}
                user={props.user}
                toDo={toDo}
              />
            )
            : <div>{props.t('This content has no task to do associated. Click on "New task" button to create a new one.')}</div>}
        </div>
      )}

      {isPopUpDisplayed && (
        <CreateToDoFromTextPopUp
          customColor={props.customColor}
          onChangeValue={handleChangePopUpValue}
          onClickTransform={() => setIsPopUpDisplayed(false)}
          onClickClose={handleClickClose}
          value={newToDoListAsText}
        />
      )}
    </div>
  )
}
export default translate()(ToDoManagement)

ToDoManagement.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  contentId: PropTypes.number.isRequired,
  onClickChangeStatusToDo: PropTypes.func.isRequired,
  onClickDeleteToDo: PropTypes.func.isRequired,
  onClickSaveNewToDo: PropTypes.func.isRequired,
  toDoList: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
  customColor: PropTypes.string,
  memberList: PropTypes.array
}

ToDoManagement.defaultProps = {
  customColor: '',
  memberList: []
}
