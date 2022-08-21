import { PAGES as p } from '../../support/urls_commands'

describe('Create to dos', () => {
  const fileTitle = 'File'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'
  const toDoText = 'Some to do text'
  const multipleTodos = `${toDoText}s
  +TheAdmin ${toDoText}n`

  describe('in a content', () => {
    beforeEach(() => {
      cy.resetDB()
      cy.setupBaseDB()

      cy.loginAs('administrators')

      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        cy.createFile(fullFilename, contentType, fileTitle, workspace.workspace_id).then(content => {
          cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId: content.content_id } })
          cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
          cy.get('[data-cy=popin_right_part_todo]').click()
        })
      })
    })

    it('should show a message if content do not have the to dos', () => {
      cy.get('[data-cy=toDo__empty]').should('be.visible')
    })

    it('should create a to do for "nobody" and add to the list', () => {
      cy.get('.toDo__newButton').click()
      cy.get('.toDo__new__toDoText textarea').type(toDoText)
      cy.get('[data-cy=toDoManagement__buttons__new]').click()
      cy.contains('.toDoItem__content__task', toDoText)
    })

    it('should create a to do for a user and add to the list', () => {
      cy.get('.toDo__newButton').click()
      cy.get('.toDo__new__assignedPerson > div').type('1')
      cy.get('#react-select-2-option-1').click()
      cy.get('.toDo__new__toDoText textarea').type(toDoText)
      cy.get('[data-cy=toDoManagement__buttons__new]').click()
      cy.contains('.toDoItem__content__task', '+TheAdmin')
      cy.contains('.toDoItem__content__task', toDoText)
    })

    it('should create multiple to dos from text and add to the list', () => {
      cy.get('.toDo__newButton').click()
      cy.get('.toDoManagement__creation__linkButton .linkButton').click()
      cy.get('.createToDoFromTextPopup__main textarea').type(multipleTodos)
      cy.get('[data-cy=createToDoFromTextPopup__buttons__create]').click()
      cy.get('[data-cy=toDoManagement__buttons__new]').click()
      cy.get('.toDoItem__content__task').should('have.length', 2)
      cy.contains('.toDoItem__content__task', `${toDoText}s`).should('be.visible')
      cy.contains('.toDoItem__content__task', '+TheAdmin').should('be.visible')
      cy.contains('.toDoItem__content__task', `${toDoText}n`).should('be.visible')
    })
  })
})
