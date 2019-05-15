// INFO - CH - 2019-05-15 - The function bellow assumes you already is on a workspace's content list page
export const create_file = (cy) => {
  cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
  cy.get('.show .subdropdown__link__file__icon').should('be.visible').click()

  cy.dropFixtureInDropZone('the_pdf.pdf', 'image/gif', '.filecontent__form')

  cy.get('[data-cy=popup__createcontent__form__button]')
    .click()

  cy.get(`.workspace__content__fileandfolder > .content[title="blob"] .fa.fa-paperclip`)
    .should('be.visible')
}
