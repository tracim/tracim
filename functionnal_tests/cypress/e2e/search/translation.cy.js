import { PAGES } from '../../support/urls_commands'

const searchURL = '/search-result'

const searchInput = '[data-cy=search__text]'
const searchButton = '[data-cy=search__btn]'
const searchText = 'This long sentence will probably never yield any result but I hope it will make the reviewer smile a bit.'

/**
 * TODO - PGO - 2026-08-18 - Currently this test is working only in simple search, advanced search is not supported
 */

describe('Search', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.get(searchInput).type(searchText)
    cy.get(searchButton).click()
    cy.url().should('include', searchURL)
  })

  it('should have translations', () => {
    cy.get('.searchResult__title').contains('Search results')

    cy.changeLanguage('fr')
    cy.get(searchInput).type(searchText)
    cy.get(searchButton).click()
    cy.get('.searchResult__title').contains('Résultats de la recherche')

    cy.changeLanguage('pt')
    cy.get(searchInput).type(searchText)
    cy.get(searchButton).click()
    cy.get('.searchResult__title').contains('Resultados da pesquisa')

    cy.changeLanguage('de')
    cy.get(searchInput).type(searchText)
    cy.get(searchButton).click()
    cy.get('.searchResult__title').contains('Suchergebnisse')
  })
})
