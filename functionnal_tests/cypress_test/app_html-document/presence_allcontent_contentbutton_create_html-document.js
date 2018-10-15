import { login, logout } from '../helpers/index.js'

describe('navigate :: allcontent > headerbutton > create_new > html-document', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        logout (cy)
    })
    it ('allcontent > button', function() {
        cy.visit('/workspaces/1/contents')
        cy.get('.pageTitleGeneric__title__icon').should('be.visible')
        cy.get('.workspace__content__button.dropdownCreateBtn .__label').should('be.visible')
        cy.get('.workspace__content__button.dropdownCreateBtn .__label').click()
        cy.get('.show .subdropdown__link__html-document__icon').should('be.visible')
    })
})
