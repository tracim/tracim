// INFO - CH - 2019-05-15 - The function bellow assumes you already is on a workspace's content list page
export const create_folder = (cy, folderTitle = 'Folder 1') => {
  cy.get('[data-cy=dropdownCreateBtn]').should('be.visible').click()
  cy.get('.show .subdropdown__link__folder__icon').should('be.visible').click()
  cy.get('.cardPopup__container').should('be.visible')
  cy.get('.cardPopup__container .cardPopup__header').should('be.visible')
  cy.get('.cardPopup__container .cardPopup__close').should('be.visible')
  cy.get('.cardPopup__container .cardPopup__body').should('be.visible')
  cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')

  cy.get('.cardPopup__container .createcontent .createcontent__form__input')
    .type(folderTitle)

  cy.get('.cardPopup__container .createcontent .createcontent__form__input')
    .should('have.attr', 'value', folderTitle)
    .should('have.attr', 'placeholder')

  cy.get('[data-cy=popup__createcontent__form__button]')
    .click()

  cy.get('.workspace__content__fileandfolder > .folder')
    .should('be.visible')
}

// INFO - CH - 2019-05-15 - The function bellow assumes you on a workspace's content list page AND
// the folder is already created
export const open_app_advanced_folder = (cy) => {
  cy.get('.workspace__content__fileandfolder > .folder .extandedaction.dropdown')
    .should('be.visible')
    .click()

  cy.get('.workspace__content__fileandfolder > .folder .extandedaction.dropdown')
    .find('.fa.fa-pencil')
    .click()
}
