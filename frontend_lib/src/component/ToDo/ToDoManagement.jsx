import React, { useEffect, useState } from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import IconButton from '../Button/IconButton.jsx'
import ToDoItem, {
  isDeletable,
  isEditable
} from './ToDoItem.jsx'
import NewToDo from './NewToDo.jsx'
import { BtnSwitch } from '../Input/BtnSwitch/BtnSwitch.jsx'
import { ROLE } from '../../helper.js'

const ToDoManagement = (props) => {
  const isReader = props.user.userRoleIdInWorkspace === ROLE.reader.id
  const [isNewToDo, setIsNewToDo] = useState(props.toDoList.length === 0 && !isReader)
  const [isMultiCreationMode, setIsMultiCreationMode] = useState(false)
  const [newToDoList, setnewToDoList] = useState([])

  useEffect(() => {
    setnewToDoList([{
      assigneeId: null,
      value: null
    }])
  }, [isMultiCreationMode])

  const addTodo = () => {
    const tmpToDoList = [...newToDoList]
    tmpToDoList.push(
      {
        assigneeId: null,
        value: null
      }
    )
    setnewToDoList(tmpToDoList)
  }

  const handleClickCancel = () => setIsNewToDo(false)
  const handleClickSaveToDo = () => {
    newToDoList.forEach(newToDo => {
      props.onClickSaveNewToDo(newToDo.assigneeId, newToDo.value)
    })
    setIsNewToDo(false)
  }

  const handleChangeAssignee = (e, index) => {
    const tmpToDoList = [...newToDoList]
    tmpToDoList[index].assigneeId = e.value
    setnewToDoList(tmpToDoList)
  }

  const handleChangeValue = (e, index) => {
    const tmpToDoList = [...newToDoList]
    tmpToDoList[index].value = e.target.value
    setnewToDoList(tmpToDoList)
  }

  const handleBtnSwitchChange = (event) => {
    setIsMultiCreationMode(!isMultiCreationMode)
  }

  return (
    isNewToDo
      ? (
        <div className='toDoManagement__creation'>
          <div className='toDoManagement__creation__btnSwitch'>
            <BtnSwitch
              activeLabel={props.t('Creation multiple')}
              checked={isMultiCreationMode}
              inactiveLabel={props.t('Creation unique')}
              isRightAligned
              onChange={handleBtnSwitchChange}
              smallSize
            />
          </div>

          {
            isMultiCreationMode
              ? (
                  newToDoList.map((toDo, index) => {
                    return (
                      <NewToDo
                        apiUrl={props.apiUrl}
                        onChangeAssignedId={(e) => handleChangeAssignee(e, index)}
                        onChangeValue={(e) => handleChangeValue(e, index)}
                        compactMode
                        contentId={props.contentId}
                        customColor={props.customColor}
                        key={`todoList__${index}`}
                        memberList={props.memberList}
                      />
                    )
                  })
              ) : (
                <NewToDo
                  apiUrl={props.apiUrl}
                  onChangeAssignedId={(e) => handleChangeAssignee(e, 0)}
                  onChangeValue={(e) => handleChangeValue(e, 0)}
                  contentId={props.contentId}
                  customColor={props.customColor}
                  key={`todoList__${newToDoList.length}`}
                  memberList={props.memberList}
                />
              )
          }


          <div className='toDoManagement__buttons'>

          {
            isMultiCreationMode && (
              <IconButton
                icon='fas fa-plus'
                onClick={addTodo}
                color={props.customColor}
              />
            )
          }

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
                onClick={() => handleClickSaveToDo()}
                disabled={!newToDoList[0].value}
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
      )

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
