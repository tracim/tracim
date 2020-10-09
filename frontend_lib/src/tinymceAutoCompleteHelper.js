const MENTION_AUTOCOMPLETE_REGEX = /(?:^|\s)@([a-zA-Z\-_]*)$/

const USERNAME_ALLOWED_CHARACTERS_REGEX = /[a-zA-Z\-_]/

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

export const tinymceAutoCompleteHandleInput = (e, setState, fetchMentionList, isAutoCompleteActivated) => {
  const selAndOffset = getSelAndOffset()

  if (previousSelAndOffset && previousSelAndOffset.text === selAndOffset.text && previousSelAndOffset.offset === selAndOffset.offset) {
    // INFO - RJ - 2020-09-14 - handleInput is called twice after typing a key because the selection also changes.
    // This check allows not doing the work twice.
    return
  }

  previousSelAndOffset = selAndOffset

  if (MENTION_AUTOCOMPLETE_REGEX.test(getTextOnCursor(selAndOffset))) {
    if (isAutoCompleteActivated) {
      tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
      return
    }

    if (e && (e.data || e.key === 'Backspace')) {
      // The user typed something in a mention or in the beginning of a mention
      setState({ isAutoCompleteActivated: true })
      tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
      return
    }
  }

  setState({ isAutoCompleteActivated: false })
}

const tinymceAutoCompleteSearchForMentionCandidate = async (fetchMentionList, setState) => {
  const mentionCandidate = getTextOnCursor(previousSelAndOffset).match(MENTION_AUTOCOMPLETE_REGEX)
  if (!mentionCandidate) {
    previousSelAndOffset = null
    setState({ isAutoCompleteActivated: false })
    return
  }

  const nameCandidate = mentionCandidate[1]
  const fetchSearchMentionList = await fetchMentionList(nameCandidate)
  setState({
    autoCompleteItemList: fetchSearchMentionList.filter(item => item.mention),
    autoCompleteCursorPosition: 0
  })
}

export const tinymceAutoCompleteHandleKeyUp = (event, setState, isAutoCompleteActivated, fetchMentionList) => {
  if (!isAutoCompleteActivated || event.key !== 'Backspace') return
  previousSelAndOffset = getSelAndOffset()
  tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
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

// RJ - 2020-09-25 - FIXME
// Duplicate code with tinymceAutoCompleteHelper.js
// See https://github.com/tracim/tracim/issues/3639

export const tinymceAutoCompleteHandleClickItem = (autoCompleteItem, setState) => {
  if (!autoCompleteItem.mention) {
    console.log('Error: this member does not have a username')
    return
  }

  const sel = tinymce.activeEditor.selection.getSel()
  const cursorPos = sel.anchorOffset
  const spaceAfterMention = '\u00A0'

  const charAtCursor = cursorPos - 1
  const text = sel.anchorNode.textContent
  const posAt = text.lastIndexOf('@', charAtCursor)
  let textBegin, textEnd

  if (posAt > -1) {
    textBegin = text.substring(0, posAt) + '@' + autoCompleteItem.mention + spaceAfterMention
    textEnd = text.substring(seekUsernameEnd(text, cursorPos))
  } else {
    console.log('Error: mention autocomplete: did not find "@"')
    textBegin = text + ' @' + autoCompleteItem.mention + spaceAfterMention
    textEnd = ''
  }

  sel.anchorNode.textContent = textBegin + textEnd
  sel.collapse(sel.anchorNode, textBegin.length)
  setState({ isAutoCompleteActivated: false })
}

export const tinymceAutoCompleteHandleSelectionChange = (setState, fetchMentionList, isAutoCompleteActivated) => {
  tinymceAutoCompleteHandleInput(null, setState, fetchMentionList, isAutoCompleteActivated)
}
