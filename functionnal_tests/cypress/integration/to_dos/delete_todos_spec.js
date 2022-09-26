import { PAGES } from '../../support/urls_commands'

describe('Delete to dos', () => {
  const fileTitle = 'File'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'
  const toDoText = 'Some to do text'
  let workspaceId, contentId

  describe('in a content', () => {

    before(() => {
      cy.resetDB()
      cy.setupBaseDB()

      cy.loginAs('administrators')

      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        cy.createFile(fullFilename, contentType, fileTitle, workspaceId).then(content => {
          contentId = content.content_id
        })
      })
    })

    describe('As space manager', () => {
      before(() => {
        cy.loginAs('administrators')
        cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } }).then(() => {
          cy.contains('.FilenameWithBadges__label', fileTitle)

          cy.get('[data-cy=popin_right_part_todo]').click()
          cy.get('.toDo__newButton').click()
          cy.get('.toDoManagement__creation__linkButton .linkButton').click()
          cy.get('.createToDoFromTextPopup__main textarea').type(`+johndoe ${toDoText}
        +TheAdmin ${toDoText}`)
          cy.get('[data-cy=createToDoFromTextPopup__buttons__create]').click()
          cy.get('[data-cy=toDoManagement__buttons__new]').click()

          cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId: workspaceId } })
          cy.contains('.workspace_advanced__userlist__list__item', '@johndoe').within(() => {
            cy.get('button.btn').click()
            cy.contains('.dropdownMenuItem', 'Space manager').click()
          })
        })
      })

      beforeEach(() => {
        cy.logout()
        cy.loginAs('users')
        cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } }).then(() => {
          cy.contains('.FilenameWithBadges__label', fileTitle)
          cy.get('[data-cy=popin_right_part_todo]').click()
        })
      })

      it('should be able to delete the assigned to do', () => {
        cy.contains('.toDoItem', '+johndoe').within(() => {
          cy.get('.toDoItem__delete').should('be.visible').click().should('not.exist')
        })
      })

      it('should be able to delete the unassigned to do', () => {
        cy.contains('.toDoItem', '+TheAdmin').within(() => {
          cy.get('.toDoItem__delete').should('be.visible').click().should('not.exist')
        })
      })
    })

    describe('As contributor', () => {
      before(() => {
        cy.loginAs('administrators')

        cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId: workspaceId } })
        cy.contains('.workspace_advanced__userlist__list__item', '@johndoe').within(() => {
          cy.get('button.btn').click()
          cy.contains('.dropdownMenuItem', 'Contributor').click()
        })
        cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } }).then(() => {
          cy.contains('.FilenameWithBadges__label', fileTitle)

          cy.get('[data-cy=popin_right_part_todo]').click()
          cy.get('.toDo__newButton').click()
          cy.get('.toDoManagement__creation__linkButton .linkButton').click()
          cy.get('.createToDoFromTextPopup__main textarea').type(`+johndoe ${toDoText}
        +TheAdmin ${toDoText}`)
          cy.get('[data-cy=createToDoFromTextPopup__buttons__create]').click()
          cy.get('[data-cy=toDoManagement__buttons__new]').click()
        })
      })

      beforeEach(() => {
        cy.logout()
        cy.loginAs('users')
        cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } }).then(() => {
          cy.contains('.FilenameWithBadges__label', fileTitle)
          cy.get('[data-cy=popin_right_part_todo]').click()
        })
      })

      it('should not be able to delete any to dos', () => {
        cy.contains('.toDoItem', '+johndoe').within(() => {
          cy.get('.toDoItem__delete').should('not.exist')
        })
        cy.contains('.toDoItem', '+TheAdmin').within(() => {
          cy.get('.toDoItem__delete').should('not.exist')
        })
      })

      describe('As owner', () => {
        it('should be able to delete the owned to do', () => {
          cy.get('.toDo__newButton').click()
          cy.get('.toDo__new__toDoText textarea').type('customToDo').then(() => {
            cy.get('[data-cy=toDoManagement__buttons__new]').click()
            cy.get('.wsContentGeneric__content__right__content__title').should('be.visible')
            cy.contains('.toDoItem', 'customToDo').within(() => {
              cy.get('.toDoItem__delete').should('be.visible').click().should('not.exist')
            })
          })
        })
      })
    })
  })
})
