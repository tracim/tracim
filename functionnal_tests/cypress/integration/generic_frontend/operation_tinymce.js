import {PAGES as p} from "../../support/urls_commands"
import { SELECTORS as s } from '../../support/generic_selector_commands'

describe('TinyMce text editor', function () {
    const fileName = 'testFile'

    before(() => {
        cy.resetDB()
        cy.setupBaseDB()
        cy.loginAs('users')
        cy.createHtmlDocument(fileName, 1)
        cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: 1 }})
    })

    describe('Click to add an Image to the html document created', function () {
        it('The input tag should not be visible', function () {
            cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName }}).click()
            cy.waitForTinyMCELoaded().then(() => {
                cy.getTag({selectorName: s.CONTENT_FRAME})
                    .find('.mce-i-image')
                    .parent()
                    .click()
                cy.get('#hidden_tinymce_fileinput').should('be.not.visible')
            })
        })
    })

})
