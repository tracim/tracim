import { PAGES as p } from '../../support/urls_commands'

describe('Create to dos', () => {
  let contentId
  const fileTitle = 'File'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'
  const toDoText = 'Some to do text'

  describe('in a content', () => {

    beforeEach(() => {
      cy.resetDB()
      cy.setupBaseDB()

      cy.loginAs('administrators')

      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        cy.createFile(fullFilename, contentType, fileTitle, workspace.workspace_id).then(content => {
          contentId = content.content_id
          cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId } })
          cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
          cy.get('[data-cy=popin_right_part_todo]').click()
          // cy.get('.toDo__newButton').click()
        })
      })
    })

    it('should be able to check and uncheck the assigned to do', () => {
      cy.get('.toDo__new__assignedPerson > div').type('2')
      cy.get('#react-select-2-option-2').click()
      cy.get('.toDo__new__toDoText textarea').type(toDoText)
      cy.get('[data-cy=toDoManagement__buttons__new]').click()
      cy.loginAs('users')
      cy.contains('.toDoItem', '+johndoe').get('.toDoItem__checkbox button').click()
      cy.get('.toDoItemChecked').should('be.visible')
      cy.contains('.toDoItem', '+johndoe').get('.toDoItem__checkbox button').click()
      cy.get('.toDoItemChecked').should('not.be.visible')
    })

    it('should not be able to check and uncheck the assigned to do', () => {
      cy.get('.toDo__new__assignedPerson > div').type('1')
      cy.get('#react-select-2-option-1').click()
      cy.get('.toDo__new__toDoText textarea').type(toDoText)
      cy.get('[data-cy=toDoManagement__buttons__new]').click()
      cy.loginAs('users')
      cy.contains('.toDoItem', '+TheAdmin').get('.toDoItem__checkbox button').click()
      cy.get('.toDoItemChecked').should('not.be.visible')
    })
  })
})
