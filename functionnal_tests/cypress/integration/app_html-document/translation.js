import { PAGES } from '../../support/urls_commands.js'

describe('App Folder Advanced', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visitPage({
        pageName: PAGES.CONTENTS,
        getters: { type: 'html-document' },
        params: { workspaceId: workspace.workspace_id }
      })
    })
    cy.get('.workspace__header__btnaddcontent__label__text').click()
    cy.get('.subdropdown__link__html-document__text').click()
    cy.get('.createcontent__form__input').type('test')
    cy.get('[data-cy="popup__createcontent__form__button"]').click()
  })

  it('should have translations', () => {
    cy.get('.wsContentGeneric__option__menu__addversion').contains('Edit')

    cy.changeLanguage('fr')
    cy.get('.wsContentGeneric__option__menu__addversion').contains('Modifier')

    cy.changeLanguage('pt')
    cy.get('.wsContentGeneric__option__menu__addversion').contains('Editar')
  })
})
