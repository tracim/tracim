import { PAGES } from '../../support/urls_commands'

describe('content :: home_page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.get('.sidebar__content__navigation__workspace__item__number').click()
  })

  it('should have translations', () => {
    cy.get('[data-cy="sidebar_subdropdown-contents/html-document"]').contains('Notes')

    cy.changeLanguage('fr')
    cy.get('[data-cy="sidebar_subdropdown-contents/html-document"]').contains('Notes')

    cy.changeLanguage('pt')
    cy.get('[data-cy="sidebar_subdropdown-contents/html-document"]').contains('Notas')
  })
})
