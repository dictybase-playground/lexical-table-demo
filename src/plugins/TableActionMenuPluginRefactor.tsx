import { useEffect, useRef, useState } from "react"
import {
  Divider,
  Icon,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
} from "@material-ui/core"
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown"
import { createPortal } from "react-dom"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical"
import { $getTableCellNodeFromLexicalNode } from "@lexical/table"

const useTableMenuButtonStyles = makeStyles({
  root: {
    position: "absolute",
  },
  //   maybe change the hover styles too?
})

type TableMenuButtonProperties = {
  anchorElement: HTMLElement
}

const TableMenuButton = ({ anchorElement }: TableMenuButtonProperties) => {
  const [isOpen, setIsOpen] = useState(false)
  const { root } = useTableMenuButtonStyles()
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // When resizing the viewport, the button can become misplaced
    const menuButtonDOM = menuButtonRef.current

    if (!menuButtonDOM) return

    const menuButtonRectangle = menuButtonDOM.getBoundingClientRect()
    const anchorElementRectangle = anchorElement.getBoundingClientRect()

    menuButtonDOM.style.left = `${
      anchorElementRectangle.right - menuButtonRectangle.width
    }px`
    menuButtonDOM.style.top = `${
      anchorElementRectangle.top + 10 - menuButtonRectangle.height / 2
    }px`
  }, [anchorElement])

  return (
    <>
      <IconButton
        size="small"
        onClick={() => setIsOpen(true)}
        ref={menuButtonRef}
        className={root}>
        <KeyboardArrowDownIcon />
      </IconButton>
      <Menu
        open={isOpen}
        getContentAnchorEl={null}
        // This needs to be set to null for anchorOrigin.vertical to have affect
        anchorEl={menuButtonRef.current}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        onClose={() => setIsOpen(false)}>
        <MenuItem onClick={() => setIsOpen(false)}> Insert Row Above </MenuItem>
        <MenuItem onClick={() => setIsOpen(false)}> Insert Row Below </MenuItem>
        <Divider />
        <MenuItem onClick={() => setIsOpen(false)}>
          Insert Column Above
        </MenuItem>
        <MenuItem onClick={() => setIsOpen(false)}>
          Insert Column Below
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setIsOpen(false)}> Delete Row </MenuItem>
        <MenuItem onClick={() => setIsOpen(false)}> Delete Column </MenuItem>
        <MenuItem onClick={() => setIsOpen(false)}> Delete Table </MenuItem>
      </Menu>
    </>
  )
}

const TableActionMenuPlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [currentTableCellDOM, setCurrentTableCellDOM] =
    useState<HTMLElement | null>(null)

  useEffect(() => {
    // register a listener for selection command,
    // if the selection is inside a table cell, get the current DOM element for that cell
    // and store it in state, which is used by TableMenuButton for positioning
    // switch to using atom for this later
    return editor.registerCommand(
      // lexical's demo uses registerUpdateListener, maybe that's the right choice, look into later
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) return true
        // lexical also has other non-null checks for other variables, that I don't think are necessary, but I will look closer
        const tableCellNode = $getTableCellNodeFromLexicalNode(
          selection.anchor.getNode(),
        )

        if (!tableCellNode) {
          setCurrentTableCellDOM(null)
          return true
        }

        const tableCellParentNodeDOM = editor.getElementByKey(
          tableCellNode.getKey(),
        )

        setCurrentTableCellDOM(tableCellParentNodeDOM)
        return true
      },
      1,
    )
  }, [editor])

  if (currentTableCellDOM)
    return createPortal(
      // maybe a popper or popover mui element here instead
      <TableMenuButton anchorElement={currentTableCellDOM} />,
      document.body,
    )

  return null
}

export default TableActionMenuPlugin
