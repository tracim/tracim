import { PAGES } from '../../support/urls_commands'

describe('having default role selected when adding a new member to space', function () {
    let workspaceId
    let workspaceLabel
    const user = 'John Doe'

    beforeEach(() => {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        workspaceLabel = workspace.label
      })
    })

    it('should pre-select same role as workspace default role when adding new member in advanced workspace', () => {
        const randomSelection = Math.floor(Math.random()*4)
        cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
        cy.contains('.pageTitleGeneric__title__label', 'My space').should('be.visible')
        cy.get('.dashboard__workspace__detail__buttons .iconbutton').click()
        cy.get('.singleChoiceList__item__radioButton').eq(randomSelection).click()
        cy.get('.workspace_advanced__defaultRole__bottom__btn').click()
        cy.get('.workspace_advanced__userlist__adduser__button__avatar').click()
        cy.get('.workspace_advanced__userlist .singleChoiceList__item__radioButton input').eq(randomSelection).should('be.checked')
    })

    it('should pre-select and save same role as workspace default role when adding new member in workspace', () => {
        const randomSelection = Math.floor(Math.random()*4)
        cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
        cy.contains('.pageTitleGeneric__title__label', 'My space').should('be.visible')
        cy.get('.dashboard__workspace__detail__buttons .iconbutton').click()
        cy.get('.singleChoiceList__item__radioButton').eq(randomSelection).click()
        cy.get('.singleChoiceList__item__text__content__name').eq(randomSelection).then((el) => {
            const userStatus = el.text()
            cy.get('.workspace_advanced__defaultRole__bottom__btn').click()
            cy.get('.workspace_advanced__contentpage__header [data-cy=popinFixed__header__button__close]').click()
            cy.get('.memberlist__list__item__last .memberlist__list__item__delete').click()
            cy.get('.memberlist__btnadd__button__text').click()
            cy.get('[data-cy=addmember]').should('be.visible').type(user)
            cy.get('.autocomplete__item__name')
            .contains(user)
            .click()
            cy.contains('Validate').click()
            cy.contains(user)
            cy.get('.memberlist__list__item__last .memberlist__list__item__info__role')
                .contains(userStatus)
        })
    })
})