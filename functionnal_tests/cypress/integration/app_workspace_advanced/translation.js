describe('App Workspace Advanced', function () {
  const newDescription = 'description'
  let workspaceId = 1
  let workspaceDescription = ''

  before(() => {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      cy.visit("/ui/admin/workspace")
  })

  it('should have translations', () => {
    cy.get('.adminWorkspace__title').contains('Shared space management')

    cy.changeLanguage('fr')
    cy.get('.adminWorkspace__title').contains('Gestion des espaces partagés')

    cy.changeLanguage('pt')
    cy.get('.adminWorkspace__title').contains('Gestão de espaço partilhado')
  })
})
