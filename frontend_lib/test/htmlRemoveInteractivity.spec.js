import { expect } from 'chai'
import { removeInteractiveContentFromHTML } from '../src/htmlRemoveInteractivity.js'

const normalizeWhitespace = (html) => html.replace(/[\s]+/g, ' ')

const buttonText = '{texts inside buttons should go}'
const optionText1 = '{texts inside options should go, part 1}'
const optionText2 = '{texts inside options should go, part 2}'
const styleContent = '#and-lets-get-rid-of-style-tags-to { display: none !important }'

const scriptContent = `
  function doYouLikeScripts() {
    console.log('you’ll need to do without those too')
  }
`

const contentGoingAway = [buttonText, optionText1, optionText2, styleContent, scriptContent]

const htmlCode = `
<body>
  <p> Welcome to the wonderful world of HTML parsing. </p>
  <p>
    As you might know, <a href="http://perdu.com/"> links are not allowed within links </a>.
    We therefore should remove them from HTML previews.
  </p>
  <p id="maybe-not-unique"> Ids are not desirable too </p>
  <h1 name="not-unique"> names too </h1>
  <ul>
    <li> Actually, anything interactive needs to be removed. So, controls in video:
      <video src="best-video.mkv" controls>
      </vide>
      They should go
    </li>
    <li> Obviously, we don't want <button>${buttonText}</button>, not <input type="text" value="I should disappear!" /></h1>
  </ul>
  <details>
    <summary>Did you know the details tag?</summary>
    It's wonderful. It can be used to write a F.A.Q. for example. They are folded by default, only showing the contents in the summary tag. One can unfold it by clicking on it. It's interactive so we should get rid of it too. summary tag should be turned into something else.
  </details>
  <p><label for="a-select-that-will-disappear"> Should be turned into a span </label></p>
  <select id="a-select-that-will-disappear">
    <option value="please">${optionText1}</option>
    <option value="go">${optionText2}</option>
  </select>
  <style>${styleContent}</style>
  <script>${scriptContent}</script>
</body>
`
const originalHtmlTextContent = new DOMParser().parseFromString(htmlCode, 'text/html').body.textContent
const expectedHtmlTextContent = normalizeWhitespace(
  contentGoingAway.reduce(
    (acc, cur) => acc.replace(cur, ''),
    originalHtmlTextContent
  )
)

const resultingHTMLBody = new DOMParser().parseFromString(removeInteractiveContentFromHTML(htmlCode), 'text/html').body

describe('The HTML without interactivity', () => {
  it('has the expected text', () => {
    expect(normalizeWhitespace(resultingHTMLBody.textContent)).to.equal(expectedHtmlTextContent)
  })

  it('does not have any id, name, controls, for attributes', () => {
    // eslint-disable-next-line no-unused-expressions
    expect(resultingHTMLBody.querySelector('[id], [name], [name], [controls], [for]')).to.be.null
  })

  it('does not have any button, a, input, select, details, script, style', () => {
    // eslint-disable-next-line no-unused-expressions
    expect(resultingHTMLBody.querySelector('button, a, input, select, details, script, style')).to.be.null
  })

  it('has a fake link', () => {
    expect(resultingHTMLBody.querySelector('a-in-preview').title).to.equal('http://perdu.com/')
  })
})
