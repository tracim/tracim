describe('App Workspace Advanced', function () {
  const newDescription = 'description'
  const workspaceId = 1
  const workspaceDescription = ''

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visit('/ui/admin/workspace')
  })

  it('should have translations', () => {
    cy.get('.adminWorkspace__workspaceTable').contains('Space')

    cy.changeLanguage('fr')
    cy.get('.adminWorkspace__workspaceTable').contains('Espace')

    cy.changeLanguage('pt')
    cy.get('.adminWorkspace__workspaceTable').contains('Espaço')
  })
})
