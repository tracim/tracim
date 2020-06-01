describe('content :: home_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visit('/ui')
    cy.get('.sidebar__content__navigation__workspace__item__number').click()
  })

  it('should have translations', () => {
    cy.get('[data-cy="sidebar_subdropdown-contents/html-document"]').contains('Text Documents')

    cy.changeLanguage('fr')
    cy.get('[data-cy="sidebar_subdropdown-contents/html-document"]').contains('Documents texte')

    cy.changeLanguage('pt')
    cy.get('[data-cy="sidebar_subdropdown-contents/html-document"]').contains('Documentos de texto')
  })
})
