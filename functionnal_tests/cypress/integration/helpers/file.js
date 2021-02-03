// INFO - CH - 2019-05-15 - The function bellow assumes you already is on a workspace's content list page
// it is better to use commands from support/db_commands.js (write it if not exists)
export const create_file = (cy, fileTitle = 'newFile') => {
  cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
  cy.get('.show .subdropdown__link__file__icon').should('be.visible').click()

  cy.dropFixtureInDropZone('artikodin.png', 'image/png', '.filecontent__form', fileTitle)

  cy.get('[data-cy=popup__createcontent__form__button]')
    .click()

  cy.get('[data-cy="popinFixed"].file')
    .should('be.visible')

  cy.get(`.workspace__content__fileandfolder > .content[title="${fileTitle}"] .fas.fa-paperclip`)
    .should('be.visible')
}
