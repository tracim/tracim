const sharedSpaceManager = 'Shared space manager'
const ROLE_WORKSPACE_CONTRIBUTOR = 'contributor'

context('Known users as a workspace-manager', function () {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy
      .fixture('baseWorkspace').then(workspace => {
        cy.visit(`/ui/workspaces/${workspace.workspace_id}/dashboard`)
      })
  })

  it('Adds a known member to a workspace using public name', function () {
    cy.get('[data-cy=memberlist__btnadd]').should('not.exist')
  })
})
