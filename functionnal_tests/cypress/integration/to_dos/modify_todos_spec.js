import { PAGES as p } from '../../support/urls_commands'

describe('Modify to dos', () => {
  let contentId
  const fileTitle = 'File'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'
  const toDoText = 'Some to do text'

  describe('in a content', () => {

    before(() => {
      cy.resetDB()
      cy.setupBaseDB()

      cy.loginAs('administrators')

      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        cy.createFile(fullFilename, contentType, fileTitle, workspace.workspace_id).then(content => {
          contentId = content.content_id
          cy.visitPage({ pageName: p.CONTENT_OPEN, params: { contentId } })
          cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
          cy.get('[data-cy=popin_right_part_todo]').click()
          cy.get('.toDo__newButton').click()

          cy.get('.toDoManagement__creation__linkButton .linkButton').click()
          cy.get('.createToDoFromTextPopup__main textarea').type(`+johndoe ${toDoText}
          +TheAdmin ${toDoText}`)
          cy.get('[data-cy=createToDoFromTextPopup__buttons__create]').click()
          cy.get('[data-cy=toDoManagement__buttons__new]').click()
        })
      })
    })

    describe('As space manager', () => {
      before(() => {
        cy.loginAs('administrators')
        cy.visit('/ui/workspaces/1/advanced_dashboard')
        cy.contains('.workspace_advanced__userlist__list__item', '@johndoe').within(() => {
          cy.get('button.btn').click()
          cy.contains('.dropdownMenuItem', 'Space manager').click()
        })
      })

      beforeEach(() => {
        cy.loginAs('users')
        cy.visit('/ui/workspaces/1/contents/file/1')
        cy.get('[data-cy=popin_right_part_todo]').click()
      })

      it('should be able to check/uncheck the assigned to do', () => {
        cy.contains('.toDoItem', '+johndoe').within(() => {
          cy.get('.toDoItem__checkbox button').should('not.be.disabled').click()
        })
        cy.get('.toDoItemChecked').should('be.visible')
        cy.contains('.toDoItem', '+johndoe').within(() => {
          cy.get('.toDoItem__checkbox button').should('not.be.disabled').click()
        })
        cy.get('.toDoItemChecked').should('not.be.visible')
      })

      it('should be able to check/uncheck the unassigned to do', () => {
        cy.contains('.toDoItem', '+TheAdmin').within(() => {
          cy.get('.toDoItem__checkbox button').should('not.be.disabled').click()
        })
        cy.get('.toDoItemChecked').should('be.visible')
        cy.contains('.toDoItem', '+TheAdmin').within(() => {
          cy.get('.toDoItem__checkbox button').should('not.be.disabled').click()
        })
        cy.get('.toDoItemChecked').should('not.be.visible')
      })
    })

    describe('As contributor', () => {
      before(() => {
        cy.loginAs('administrators')
        cy.visit('/ui/workspaces/1/advanced_dashboard')
        cy.contains('.workspace_advanced__userlist__list__item', '@johndoe').within(() => {
          cy.get('button.btn').click()
          cy.contains('.dropdownMenuItem', 'Contributor').click()
        })
      })

      beforeEach(() => {
        cy.loginAs('users')
        cy.visit('/ui/workspaces/1/contents/file/1')
        cy.get('[data-cy=popin_right_part_todo]').click()
      })

      it('should be able to check/uncheck the assigned to do', () => {
        cy.contains('.toDoItem', '+johndoe').within(() => {
          cy.get('.toDoItem__checkbox button').should('not.be.disabled').click()
        })
        cy.get('.toDoItemChecked').should('be.visible')
        cy.contains('.toDoItem', '+johndoe').within(() => {
          cy.get('.toDoItem__checkbox button').should('not.be.disabled').click()
        })
        cy.get('.toDoItemChecked').should('not.be.visible')
      })

      it('should not be able to check/uncheck the unassigned to do', () => {
        cy.contains('.toDoItem', '+TheAdmin').within(() => {
          cy.get('.toDoItem__checkbox button').should('be.disabled')
        })
      })

      describe('As owner', () => {
        it('should be able to check/uncheck the owned to do', () => {
          cy.get('.toDo__newButton').click()
          cy.get('.toDo__new__toDoText textarea').type('customToDo')
          cy.get('[data-cy=toDoManagement__buttons__new]').click()

          cy.contains('.toDoItem', 'customToDo').within(() => {
            cy.get('.toDoItem__checkbox button').should('not.be.disabled').click()
          })
          cy.get('.toDoItemChecked').should('be.visible')
          cy.contains('.toDoItem', 'customToDo').within(() => {
            cy.get('.toDoItem__checkbox button').should('not.be.disabled').click()
          })
          cy.get('.toDoItemChecked').should('not.be.visible')
        })
      })
    })
  })
})
