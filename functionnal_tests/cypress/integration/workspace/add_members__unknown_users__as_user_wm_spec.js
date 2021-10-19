const sharedSpaceManager = 'Space manager'
const ROLE_WORKSPACE_MANAGER = 'workspace-manager'

context('Unknown users', function () {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy
      .getUserByRole('users').as('currentUser')
      .then(user =>
        cy.createRandomWorkspace().as('currentWorkspace')
          .then(Workspace => {
            cy.addUserToWorkspace(
              this.currentUser.user_id,
              this.currentWorkspace.workspace_id,
              ROLE_WORKSPACE_MANAGER
            )
            cy.createRandomUser().as('userToAdd')
            cy.logout()
            cy.loginAs('users').as('currentUser')
          })
      )
      .then(el => {
        cy.visit(`/ui/workspaces/${this.currentWorkspace.workspace_id}/dashboard`)
      })
  })

  it('adds an unknown user to workspace using public name', function () {
    cy.get('[data-cy=memberlist__btnadd]')
      .click()
    cy.get('[data-cy=addmember]')
      .type(this.userToAdd.public_name)
    cy.contains('[data-cy=autocomplete__item__name]', 'I know this user exists')
      .click()
    cy.contains('[data-cy=memberlist]', sharedSpaceManager)
      .click()
    cy.contains('.memberlist__form__submitbtn button', 'Validate').click()
    cy.contains('[data-cy=flashmessage]', 'Unknown user')
      .should('exist')
  })

  it('adds an unknown user to workspace using email', function () {
    cy.get('[data-cy=memberlist__btnadd]').click()
    cy.get('[data-cy=addmember]').type(this.userToAdd.email)
    cy.contains('[data-cy=autocomplete__item__name]', 'Send an invitational email to this user')
      .click()
    cy.contains('[data-cy=memberlist]', sharedSpaceManager)
      .click()
    cy.contains('.memberlist__form__submitbtn button', 'Validate').click()
    cy.contains('[data-cy=flashmessage]', 'Member added')
  })

  it('adds an unknown user to workspace using username', function () {
    cy.get('[data-cy=memberlist__btnadd]').click()
    cy.get('[data-cy=addmember]').type(this.userToAdd.username)
    cy.contains('[data-cy=autocomplete__item__name]', 'I know this user exist')
      .click()
    cy.contains('[data-cy=memberlist]', sharedSpaceManager)
      .click()
    cy.contains('.memberlist__form__submitbtn button', 'Validate').click()
    cy.contains('[data-cy=flashmessage]', 'Member added')
  })
})
