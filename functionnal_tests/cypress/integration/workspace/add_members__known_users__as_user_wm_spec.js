const sharedSpaceManager = 'Shared space manager'
const ROLE_WORKSPACE_MANAGER = 'workspace-manager'

context('Known users as a workspace-manager', function () {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    let workspaceID
    cy
      .getUserByRole('users').as('currentUser')
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

  it('Adds a known member to a workspace using public name', function () {
    cy.get('[data-cy=memberlist__btnadd]').click()
    cy.get('[data-cy=addmember]').type(this.userToAdd.email)
    cy.get('[data-cy=autocomplete__item__name]')
      .contains(this.userToAdd.public_name)
      .click()
    cy.get('[data-cy=memberlist]')
      .contains(sharedSpaceManager)
      .click()
    cy.contains('Validate').click()
    cy.get('[data-cy=flashmessage]').contains('Member added').should('be.visible')
    cy.get('[data-cy=memberlist]').contains(this.userToAdd.public_name)
  })

  it('Adds a known member to a workspace using email', function () {
    cy.get('[data-cy=memberlist__btnadd]').click()
    cy.get('[data-cy=addmember]').type(this.userToAdd.email)
    cy.get('[data-cy=autocomplete__item__name]')
      .contains(this.userToAdd.public_name)
      .click()
    cy.get('[data-cy=memberlist]')
      .contains(sharedSpaceManager)
      .click()
    cy.contains('Validate').click()
    cy.get('[data-cy=flashmessage]').contains('Member added').should('be.visible')
    cy.get('[data-cy=memberlist]').contains(this.userToAdd.public_name)
  })
})
