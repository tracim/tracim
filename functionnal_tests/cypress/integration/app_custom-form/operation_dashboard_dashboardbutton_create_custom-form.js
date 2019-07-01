describe('operation :: workspace > create_new > custom-form', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
  })
  it('dashborad > button', function () {
    cy.visit('/ui/workspaces/1/dashboard')
    cy.get('.dashboard__workspace__detail').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-users').should('be.visible')
    cy.get('.dashboard__calltoaction .fa-users').click()
    var titre1 = 'dashboard button custom-form'
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('be.visible')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'placeholder')
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').type(titre1)
    cy.get('.cardPopup__container .createcontent .createcontent__form__input').should('have.attr', 'value', titre1)
    cy.get('[data-cy=popup__createcontent__form__button]').click()
    cy.get('.cardPopup__container .createcontent .createcontent__contentname').should('not.be.visible')
    cy.get('.custom-form.visible').should('be.visible')
    cy.get('.custom-form.visible .custom-form__contentpage__messagelist__version.revision').should('be.visible')
    cy.get('.custom-form.visible .wsContentGeneric__header__title').contains(titre1)
    cy.wait(2000)
    var element1 = 'Element 1'
    cy.get('.btn-add').click()
    cy.get('#root_odj_0').type(element1)

    var date = '2019-10-27'
    cy.get('#root_date').clear().type(date)

    var duree = '20 minutes'
    cy.get('#root_duree').clear().type(duree)
    // We can add more to fill more field

    cy.get('button.custom-form__editionmode__submit.editionmode__button__submit').click({ force: true })
    cy.wait(2000)
    cy.get('#root_odj_0').should('have.value', element1)
    cy.get('#root_duree').should('have.value', duree)
    cy.get('.custom-form.visible .wsContentGeneric__header__close.custom-form__header__close').should('be.visible')
    cy.get('.custom-form.visible .wsContentGeneric__header__close.custom-form__header__close').click()
    cy.get('.custom-form.visible').should('not.be.visible')
    cy.wait(2000)
    cy.get('.content__name').contains(titre1).should('be.visible')
    cy.get('.content__name').click()
    cy.wait(2000)
    cy.get('#root_odj_0').should('have.value', element1)
    cy.get('#root_duree').should('have.value', duree)
    //        Problem to write text in iframe
    //        cy.get('#wysiwygNewVersion_ifr').click()
    //        cy.get('body').type('Ceci est le début du document')
    //        cy.get('.custom-form__editionmode__submit.editionmode__button__submit').click()
    //        cy.get('.custom-form__contentpage__textnote__text span').contains('Ceci est le début du document')
  })
})
