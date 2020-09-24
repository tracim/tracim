const MENTION_AUTOCOMPLETE_REGEX = /(?:^|\s)@([a-zA-Z\-_]*)$/

const USERNAME_ALLOWED_CHARACTERS_REGEX = /[a-zA-Z\-_]/

let lastSelAndOffset = null

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

  if (lastSelAndOffset && lastSelAndOffset.text === selAndOffset.text && lastSelAndOffset.offset === selAndOffset.offset) {
    // RJ - 2020-09-14 - NOTE: handleInput is called twice after typing a key because the selection also changes.
    // This check allows not doing the work twice.
    return
  }

  lastSelAndOffset = selAndOffset

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
  const mentionCandidate = getTextOnCursor(lastSelAndOffset).match(MENTION_AUTOCOMPLETE_REGEX)
  if (!mentionCandidate) {
    lastSelAndOffset = null
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
  lastSelAndOffset = getSelAndOffset()
  tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
}

export const tinymceAutoCompleteHandleKeyDown = (event, setState, isAutoCompleteActivated, autoCompleteCursorPosition, autoCompleteItemList) => {
  if (!isAutoCompleteActivated) return

  if (event.key === 'Escape') {
    setState({ isAutoCompleteActivated: false })
    return
  }

  switch (event.key) {
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
  if (!item.mention) {
    console.log('Error: this member does not have a username')
    return
  }

  const sel = tinymce.activeEditor.selection.getSel()
  const text = sel.anchorNode.textContent

  const posAt = text.lastIndexOf('@', sel.anchorOffset - 1)

  let textBegin, textEnd

  if (posAt > -1) {
    textBegin = text.substring(0, posAt) + '@' + item.mention + '\u00A0'
    textEnd = text.substring(seekUsernameEnd(text, sel.anchorOffset))
  } else {
    console.log('Error: mention autocomplete: did not find "@"')
    textBegin = sel.anchorNode.textContent + ' @' + item.mention + '\u00A0'
    textEnd = ''
  }

  sel.anchorNode.textContent = textBegin + textEnd
  sel.collapse(sel.anchorNode, textBegin.length)
  setState({ isAutoCompleteActivated: false })
}

export const tinymceAutoCompleteHandleSelectionChange = (setState, fetchMentionList, isAutoCompleteActivated) => {
  tinymceAutoCompleteHandleInput(null, setState, fetchMentionList, isAutoCompleteActivated)
}
