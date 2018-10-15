import { login, logout } from '../helpers/index.js'

describe('content :: workspace > dashbord', function () {
    before(function () {
        login(cy)
        cy.visit('/workspaces/1/dashboard')
        cy.url().should('include', '/workspaces/1/dashboard')
    })
    after(function() {
        logout (cy)
    })
    it ('dashboard__workspaceInfo > memberlist', function() {
        cy.get('.memberlist .memberlist__list').should('be.visible')
        cy.get('.memberlist .memberlist__header.subTitle').should('be.visible')
        cy.get('.memberlist .memberlist__wrapper').should('be.visible')
        cy.get('.memberlist .memberlist__list.withAddBtn').should('be.visible')
        cy.get('.memberlist .memberlist__btnadd').should('be.visible')
        cy.get('.memberlist .memberlist__list__item').should('be.visible')
        cy.get('.memberlist .memberlist__list__item__avatar').should('be.visible')
        cy.get('.memberlist .memberlist__list__item__info').should('be.visible')
        cy.get('.memberlist .memberlist__list__item__info__name').should('be.visible')
        cy.get('.memberlist .memberlist__list__item__info__role').should('be.visible')
        cy.get('.memberlist .memberlist__list__item__delete').should('be.visible')
        cy.get('.memberlist .fa-trash-o').should('be.visible')
    })
})
