describe('operation :: workspace > delete > thread', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
  })
  it('all content > delete thread', function () {
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-comments-o').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-comments-o').click()
    var titre1 = 'createthread'
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
    cy.get('.cardPopup__container .createcontent button.createcontent__form__button').click()
    cy.get('.cardPopup__container .createcontent  .createcontent__contentname').should('not.be.visible')
    cy.get('.thread.visible').should('be.visible')
    cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre1)
    cy.get('.thread.visible .thread__contentpage__header__close').click()
    cy.get('.thread.visible').should('not.be.visible')
    cy.visit('/ui/workspaces/1/contents')
    cy.get('.pageTitleGeneric__title__icon').should('be.visible')
    var titre1 = 'createthread'
    cy.get('.content__name').each(($elm) => {
      cy.wrap($elm).invoke('text').then((text) => {
        if (text === titre1) {
          cy.get('.content__name').contains(titre1).click()
          cy.get('.thread.visible').should('be.visible')
          cy.get('.thread.visible .wsContentGeneric__header__title').contains(titre1)
          cy.get('.thread.visible .align-items-center button:nth-child(2)').click()
          cy.get('.thread.visible .timeline__info__btnrestore').should('be.visible')
          cy.get('.thread.visible .thread__contentpage__header__close').click()
          cy.get('.thread.visible').should('not.be.visible')
        }
      })
    })
  })
})
