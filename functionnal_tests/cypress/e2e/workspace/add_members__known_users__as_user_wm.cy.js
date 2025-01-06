const sharedSpaceManager = 'Space manager'
const ROLE_WORKSPACE_MANAGER = 'workspace-manager'

context('Known users as a workspace-manager', function () {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.getUserByRole('users').as('currentUser')
      .then(user =>
        cy.createRandomWorkspace().as('currentWorkspace')
          .then(workspace => {
            cy.addUserToWorkspace(this.currentUser.user_id, this.currentWorkspace.workspace_id, ROLE_WORKSPACE_MANAGER)
            cy.createRandomUser().as('userToAdd')
          }))
      .fixture('baseWorkspace').then(workspace => {
        cy.addUserToWorkspace(this.userToAdd.user_id, workspace.workspace_id)
      })
      .then(el => {
        cy.logout()
        cy.loginAs('users').as('currentUser')
        cy.visit(`/ui/workspaces/${this.currentWorkspace.workspace_id}/dashboard`)
      })
  })

  it('should add a known member to a workspace using public name', function () {
    cy.get('[data-cy=memberlist__btnadd]').click()
    cy.get('[data-cy=addmember]').type(this.userToAdd.email)
    cy.contains('[data-cy=autocomplete__item__name]', this.userToAdd.public_name)
      .click()
    cy.contains('[data-cy=memberlist]', sharedSpaceManager)
      .click()
    cy.contains('.memberlist__form__submitbtn button', 'Validate').click()
    cy.contains('[data-cy=flashmessage]', 'Member added').should('be.visible')
    cy.contains('[data-cy=memberlist]', this.userToAdd.public_name)
  })

  it('should add a known member to a workspace using email', function () {
    cy.get('[data-cy=memberlist__btnadd]').click()
    cy.get('[data-cy=addmember]').type(this.userToAdd.email)
    cy.contains('[data-cy=autocomplete__item__name]', this.userToAdd.public_name)
      .click()
    cy.contains('[data-cy=memberlist]', sharedSpaceManager)
      .click()
    cy.contains('.memberlist__form__submitbtn button', 'Validate').click()
    cy.contains('[data-cy=flashmessage]', 'Member added').should('be.visible')
    cy.contains('[data-cy=memberlist]', this.userToAdd.public_name)
  })

  it('should add a known member to a workspace using username', function () {
    cy.get('[data-cy=memberlist__btnadd]').click()
    cy.get('[data-cy=addmember]').type(this.userToAdd.username)
    cy.contains('[data-cy=autocomplete__item__name]', this.userToAdd.public_name)
      .click()
    cy.contains('[data-cy=memberlist]', sharedSpaceManager)
      .click()
    cy.contains('.memberlist__form__submitbtn button', 'Validate').click()
    cy.contains('[data-cy=flashmessage]', 'Member added').should('be.visible')
    cy.contains('[data-cy=memberlist]', this.userToAdd.public_name)
  })
})
