describe('Delete to dos', () => {
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
        cy.createFile(fullFilename, contentType, fileTitle, workspace.workspace_id)
      })
    })

    describe('As space manager', () => {
      before(() => {
        cy.loginAs('administrators')

        cy.visit('/ui/workspaces/1/contents/file/1')

        cy.get('[data-cy=popin_right_part_todo]').click()
        cy.get('.toDo__newButton').click()
        cy.get('.toDoManagement__creation__linkButton .linkButton').click()
        cy.get('.createToDoFromTextPopup__main textarea').type(`+johndoe ${toDoText}
        +TheAdmin ${toDoText}`)
        cy.get('[data-cy=createToDoFromTextPopup__buttons__create]').click()
        cy.get('[data-cy=toDoManagement__buttons__new]').click()

        cy.visit('/ui/workspaces/1/advanced_dashboard')
        cy.contains('.workspace_advanced__userlist__list__item', '@johndoe').within(() => {
          cy.get('button.btn').click()
          cy.contains('.dropdownMenuItem', 'Space manager').click()
        })
      })

      beforeEach(() => {
        cy.logout()
        cy.loginAs('users')
        cy.visit('/ui/workspaces/1/contents/file/1')
        cy.get('[data-cy=popin_right_part_todo]').click()
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

        cy.visit('/ui/workspaces/1/advanced_dashboard')
        cy.contains('.workspace_advanced__userlist__list__item', '@johndoe').within(() => {
          cy.get('button.btn').click()
          cy.contains('.dropdownMenuItem', 'Contributor').click()
        })

        cy.visit('/ui/workspaces/1/contents/file/1')

        cy.get('[data-cy=popin_right_part_todo]').click()
        cy.get('.toDo__newButton').click()
        cy.get('.toDoManagement__creation__linkButton .linkButton').click()
        cy.get('.createToDoFromTextPopup__main textarea').type(`+johndoe ${toDoText}
        +TheAdmin ${toDoText}`)
        cy.get('[data-cy=createToDoFromTextPopup__buttons__create]').click()
        cy.get('[data-cy=toDoManagement__buttons__new]').click()
      })

      beforeEach(() => {
        cy.logout()
        cy.loginAs('users')
        cy.visit('/ui/workspaces/1/contents/file/1')
        cy.get('[data-cy=popin_right_part_todo]').click()
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
          cy.get('.toDo__new__toDoText textarea').type('customToDo')
          cy.get('[data-cy=toDoManagement__buttons__new]').click()

          cy.contains('.toDoItem', 'customToDo').within(() => {
            cy.get('.toDoItem__delete').should('be.visible').click().should('not.exist')
          })
        })
      })
    })
  })
})
