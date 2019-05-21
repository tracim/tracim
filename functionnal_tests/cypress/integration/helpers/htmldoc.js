import { assertPopupCreateContent } from './index.js'

// INFO - CH - 2019-05-15 - The function bellow assumes you already is on a workspace's content list page
// it is better to use commands from support/db_commands.js (write it if not exists)
export const create_htmldocument = (cy, htmlDocTitle = 'Html document 1') => {
  cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
  cy.get('.show .subdropdown__link__html-document__icon').should('be.visible').click()

  assertPopupCreateContent(cy)

  cy.get('.cardPopup__container .createcontent .createcontent__form__input')
    .type(htmlDocTitle)

  cy.get('.cardPopup__container .createcontent .createcontent__form__input')
    .should('have.attr', 'value', htmlDocTitle)
    .should('have.attr', 'placeholder')

  cy.get('[data-cy=popup__createcontent__form__button]')
    .click()

  cy.get('[data-cy="popinFixed"].html-document')
    .should('be.visible')

  cy.waitForTinyMCELoaded().then(() => {
    cy.get(`.workspace__content__fileandfolder > .content[title="${htmlDocTitle}"]`)
      .should('be.visible')
  })
}
