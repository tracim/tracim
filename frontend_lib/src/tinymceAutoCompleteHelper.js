import {
  autoCompleteItem,
  USERNAME_ALLOWED_CHARACTERS_REGEX
} from './helper.js'

const AUTOCOMPLETE_REGEX = /(?:^|\s)(@|#)([a-zA-Z0-9\-_]*)$/

let previousSelAndOffset = null

const seekUsernameEnd = (text, offset) => {
  while (offset < text.length && USERNAME_ALLOWED_CHARACTERS_REGEX.test(text[offset])) {
    offset++
  }

  return offset
}

const getTextOnCursor = (selAndOffset) => {
  const end = seekUsernameEnd(selAndOffset.text, selAndOffset.offset)
  return selAndOffset.text.substring(0, end)
}

const getSelAndOffset = () => {
  const sel = tinymce.activeEditor.selection.getSel()
  return {
    text: sel.anchorNode.textContent,
    offset: sel.anchorOffset
  }
}

export const tinymceAutoCompleteHandleInput = (e, setState, fetchAutoCompleteItemList, isAutoCompleteActivated) => {
  const selAndOffset = getSelAndOffset()

  if (previousSelAndOffset && previousSelAndOffset.text === selAndOffset.text && previousSelAndOffset.offset === selAndOffset.offset) {
    // INFO - RJ - 2020-09-14 - handleInput is called twice after typing a key because the selection also changes.
    // This check allows not doing the work twice.
    return
  }

  previousSelAndOffset = selAndOffset
  if (AUTOCOMPLETE_REGEX.test(getTextOnCursor(selAndOffset))) {
    if (isAutoCompleteActivated) {
      tinymceAutoCompleteSearchForMentionOrLinkCandidate(fetchAutoCompleteItemList, setState)
      return
    }

    if (e && (e.data || e.key === 'Backspace')) {
      // The user typed something in a mention/link or in the beginning of a mention/link
      setState({ isAutoCompleteActivated: true })
      tinymceAutoCompleteSearchForMentionOrLinkCandidate(fetchAutoCompleteItemList, setState)
      return
    }
  }

  setState({ isAutoCompleteActivated: false })
}

const tinymceAutoCompleteSearchForMentionOrLinkCandidate = async (fetchAutoCompleteItemList, setState) => {
  const mentionOrLinkCandidate = getTextOnCursor(previousSelAndOffset).match(AUTOCOMPLETE_REGEX)
  if (!mentionOrLinkCandidate) {
    previousSelAndOffset = null
    setState({ isAutoCompleteActivated: false })
    return
  }

  const mentionOrLink = mentionOrLinkCandidate[0].trimStart()
  const fetchSearchAutoCompleteItemList = await fetchAutoCompleteItemList(mentionOrLink)

  setState({
    autoCompleteItemList: fetchSearchAutoCompleteItemList.filter(item => item.mention || item.content_id),
    autoCompleteCursorPosition: 0
  })
}

export const tinymceAutoCompleteHandleKeyUp = (event, setState, isAutoCompleteActivated, fetchAutoCompleteItemList) => {
  if (!isAutoCompleteActivated || event.key !== 'Backspace') return
  previousSelAndOffset = getSelAndOffset()
  tinymceAutoCompleteSearchForMentionOrLinkCandidate(fetchAutoCompleteItemList, setState)
}

export const tinymceAutoCompleteHandleKeyDown = (event, setState, isAutoCompleteActivated, autoCompleteCursorPosition, autoCompleteItemList) => {
  if (!isAutoCompleteActivated) return

  switch (event.key) {
    case 'Escape': {
      setState({ isAutoCompleteActivated: false })
      break
    }
    case ' ': {
      setState({ isAutoCompleteActivated: false, autoCompleteItemList: [] })
      break
    }
    case 'Enter': {
      tinymceAutoCompleteHandleClickItem(autoCompleteItemList[autoCompleteCursorPosition], setState)
      event.preventDefault()
      break
    }
    case 'ArrowUp': {
      if (autoCompleteCursorPosition > 0) {
        setState(prevState => ({
          autoCompleteCursorPosition: prevState.autoCompleteCursorPosition - 1
        }))
      }
      event.preventDefault()
      break
    }
    case 'ArrowDown': {
      if (autoCompleteCursorPosition < autoCompleteItemList.length - 1) {
        setState(prevState => ({
          autoCompleteCursorPosition: prevState.autoCompleteCursorPosition + 1
        }))
      }
      event.preventDefault()
      break
    }
  }
}

export const tinymceAutoCompleteHandleClickItem = (item, setState) => {
  const selection = tinymce.activeEditor.selection.getSel()
  const cursorPos = selection.anchorOffset
  const text = selection.anchorNode.textContent

  const { textBegin, textEnd } = autoCompleteItem(text, item, cursorPos, ' ')

  selection.anchorNode.textContent = textBegin + textEnd
  selection.collapse(selection.anchorNode, textBegin.length)

  // NOTE - RJ - 2021-07-08 - focusing the editor lets TinyMCE execute its cleanups
  // routine. If we don't do this and the user saves the document right after an
  // autocompletion and the user picked the autocompletion item by clicking on it
  // (as opposed to pressing the enter key), the editor never receives the focus
  // and do its cleanups after removing TinyMCE and this happens asynchronously.
  // This modifies the document and saves the result in the draft stored in
  // local storage after posting the document on the API. Then, we tell the
  // user that they have a pending draft, which is confusing.
  globalThis.tinymce.activeEditor.focus()

  setState({ isAutoCompleteActivated: false })
}

export const tinymceAutoCompleteHandleSelectionChange = (setState, fetchAutoCompleteItemList, isAutoCompleteActivated) => {
  tinymceAutoCompleteHandleInput(null, setState, fetchAutoCompleteItemList, isAutoCompleteActivated)
}
