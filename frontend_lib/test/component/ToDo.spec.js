import { expect } from 'chai'
import { transformToDoTextListIntoArrayHelper } from '../../src/component/ToDo/ToDoManagement.jsx'

describe('transformToDoTextListIntoArrayHelper()', () => {
  const nobodyValueObject = { value: null, label: 'Nobody' }
  const toDosAsText = ['+Mathis Some to do text', '  Another text']
  const memberList = [
    { id: 1, publicName: 'Global Manager', username: 'TheAdmin' },
    { id: 2, publicName: 'mathis', username: 'Mathis' }
  ]

  it('should transform a text to a list of todo', () => {
    const result = transformToDoTextListIntoArrayHelper(toDosAsText, memberList, [], nobodyValueObject)
    const expectedToDoList = [
      {
        assigneeId: 2,
        value: 'Some to do text'
      },
      {
        assigneeId: null,
        value: 'Another text'
      }
    ]
    const expectedSelectedValueList = [
      {
        value: 2,
        label: 'mathis (Mathis)'
      }, {
        value: null,
        label: 'Nobody'
      }
    ]
    const expectedResult = { tmpToDoList: expectedToDoList, tmpSelectedValueList: expectedSelectedValueList }
    expect(result).to.deep.equal(expectedResult)
  })
})
