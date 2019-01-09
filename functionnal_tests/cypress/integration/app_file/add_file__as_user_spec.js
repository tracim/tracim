const sharedSpaceManager = 'Shared space manager'
const ROLE_WORKSPACE_CONTRIBUTOR = 'contributor'

context('Upload a file using drop zone', function () {
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
    cy.get('[data-cy="contentTypeBtn_contents/file"]').click()

    cy.dropFixtureInDropZone('the_pdf.pdf', 'image/gif', '.filecontent__form')
    cy.get('[data-cy=popup__createcontent__form__button]').click()
    cy.get('.previewcomponent__dloption__icon').should('have.length', 3)
    cy.contains('1 of 2')
    cy.get('#dropdownMenu2').contains('Open')
  })
})
