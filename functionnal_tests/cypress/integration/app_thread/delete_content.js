const titre1 = 'createthread'
const threadPopup = '.cardPopup__container .createcontent .createcontent__contentname'
const threadPopupInput = '.cardPopup__container .createcontent .createcontent__form__input'

describe('delete a thread content', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createThread('firstThread', 1)
  })

  beforeEach(function () {
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should show the content as deleted and remove it from the content list', function () {
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-comments-o').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-comments-o').click()

    cy.get(threadPopup).should('be.visible')
    cy.get(threadPopupInput).should('have.attr', 'placeholder')
    cy.get(threadPopupInput).type(titre1)
    cy.get(threadPopupInput).should('have.attr', 'value', titre1)
    cy.get('.cardPopup__container .createcontent button.createcontent__form__button').click()
    cy.get(threadPopup).should('not.exist')
    cy.get('.thread.visible').should('be.visible')
    cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre1)
    cy.get('.thread.visible .thread__contentpage__header__close').click()
    cy.get('.thread.visible').should('not.exist')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')

    cy.get('.content__name').each(($elm) => {
      cy.wrap($elm).invoke('text').then((text) => {
        if (text === titre1) {
          cy.get('.content__name').contains(titre1).click()
          cy.get('.thread.visible').should('be.visible')
          cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre1)
          cy.get('.wsContentGeneric__option__menu__action[data-cy="delete__button"]').click()
          cy.get('.timeline__warning > [data-cy="displaystate"] .displaystate__btn').should('be.visible')
          cy.get('.thread.visible .thread__contentpage__header__close').click()
          cy.get('.thread.visible').should('not.exist')
          cy.contains('.content__name', titre1).should('not.exist')
        }
      })
    })
  })
})
