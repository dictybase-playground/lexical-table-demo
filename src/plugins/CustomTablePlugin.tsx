/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  TableNode,
  TableCellNode,
  TableRowNode,
  $isTableNode,
  $createTableRowNode,
  $createTableCellNode,
  TableCellHeaderStates,
  applyTableHandlers,
  HTMLTableElementWithWithTableSelectionState,
  TableSelection,
} from "@lexical/table"
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $createParagraphNode,
  $createTextNode,
  $nodesOfType,
  $getNodeByKey,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  NodeMutation,
} from "lexical"
import { useEffect } from "react"
import { pipe, A, G } from "@mobily/ts-belt"
import CustomTableNode from "../nodes/CustomTableNode"

export const INSERT_CUSTOM_TABLE_COMMAND = createCommand<{
  columns: string
  rows: string
  width: number
}>()

function $createCustomTableNodeWithDimensions(
  rowCount: number,
  columnCount: number,
  width: number,
) {
  const createParagraphWithTextNode = () =>
    $createParagraphNode().append($createTextNode())

  const createCellWithParagraphNode = () =>
    $createTableCellNode(TableCellHeaderStates.NO_STATUS).append(
      createParagraphWithTextNode(),
    )

  const cellsToAppend = (cells: number) => (row: TableRowNode) => {
    Array.from({ length: cells }).forEach(() =>
      row.append(createCellWithParagraphNode()),
    )
  }

  const createRows = (rows: number) =>
    Array.from({ length: rows }).map(() => $createTableRowNode())

  const rowToAppend = (table: TableNode) => (row: TableRowNode) => {
    table.append(row)
  }

  const tableNode = new CustomTableNode(width)
  const cellFunction = cellsToAppend(columnCount)
  const rowFunction = rowToAppend(tableNode)
  pipe(rowCount, createRows, A.tap(cellFunction), A.tap(rowFunction))
  return tableNode
}

const TablePlugin = () => {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    if (!editor.hasNodes([CustomTableNode, TableCellNode, TableRowNode])) {
      throw new Error(
        `TablePlugin: TableNode, TableCellNode or TableRowNode not registered on editor`,
      )
    }

    return editor.registerCommand(
      INSERT_CUSTOM_TABLE_COMMAND,
      ({ columns, rows, width }) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return true
        }

        const { focus } = selection
        const focusNode = focus.getNode()

        if (!focusNode) return true

        const tableNode = $createCustomTableNodeWithDimensions(
          Number(rows),
          Number(columns),
          width,
        )

        // From lexical/Lexical.dev.js line 8015, under ElementNode:
        // A shadow root is a Node that behaves like RootNode. The shadow root (and RootNode) mark the
        // end of the hiercharchy, most implementations should treat it as if there's nothing (upwards)
        // beyond this point. For example, node.getTopLevelElement(), when performed inside a TableCellNode
        // will return the immediate first child underneath TableCellNode instead of RootNode.

        if ($isRootOrShadowRoot(focusNode)) {
          const target = focusNode.getChildAtIndex(focus.offset)
          if (target) {
            target.insertBefore(tableNode)
          } else {
            focusNode.append(tableNode)
          }
          tableNode.insertBefore($createParagraphNode())
        } else {
          const topLevelNode = focusNode.getTopLevelElementOrThrow()
          topLevelNode.insertAfter(tableNode)
        }

        tableNode.insertAfter($createParagraphNode())

        const firstCell = tableNode
          .getFirstChildOrThrow()
          .getFirstChildOrThrow()
        firstCell.select()

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  useEffect(() => {
    const tableSelections = new Map<string, TableSelection>()

    const initializeTableNode = (tableNode: TableNode) => {
      const nodeKey = tableNode.getKey()
      const tableElement = editor.getElementByKey(
        nodeKey,
      ) as HTMLTableElementWithWithTableSelectionState

      if (tableElement && !tableSelections.has(nodeKey)) {
        const tableSelection = applyTableHandlers(
          tableNode,
          tableElement,
          editor,
        )
        tableSelections.set(nodeKey, tableSelection)
      }
    } // Plugins might be loaded _after_ initial content is set, hence existing table nodes
    // won't be initialized from mutation[create] listener. Instead doing it here,

    editor.getEditorState().read(() => {
      const tableNodes = $nodesOfType(TableNode)

      tableNodes.map((tableNode) => {
        initializeTableNode(tableNode)
        return tableNode
      })
    })

    const unregisterMutationListener = editor.registerMutationListener(
      CustomTableNode,
      (nodeMutations) => {
        const isCreated = ([, mutation]: [string, NodeMutation]) =>
          mutation === "created"
        const getNode = (nodeKey: string) =>
          editor.getEditorState().read(() => $getNodeByKey(nodeKey))

        pipe(
          [...nodeMutations],
          A.filter(isCreated),
          A.map(A.head),
          A.filter(G.isString),
          A.map(getNode),
          A.filter($isTableNode),
          A.tap(initializeTableNode),
        )

        const isDestroyed = ([, mutation]: [string, NodeMutation]) =>
          mutation === "destroyed"

        const getTableSelection = ([nodeKey]: [string, NodeMutation]): [
          string,
          TableSelection | undefined,
        ] => [nodeKey, tableSelections.get(nodeKey)]

        const cleanUp = ([nodeKey, tableSelection]: [
          string,
          TableSelection | undefined,
        ]) => {
          if (!tableSelection) return
          tableSelection.removeListeners()
          tableSelections.delete(nodeKey)
        }

        pipe(
          [...nodeMutations],
          A.filter(isDestroyed),
          A.map(getTableSelection),
          A.tap(cleanUp),
        )
      },
    )
    return () => {
      unregisterMutationListener() // Hook might be called multiple times so cleaning up tables listeners as well,
      // as it'll be reinitialized during recurring call
      ;[...tableSelections].forEach(([, tableSelection]) => {
        tableSelection.removeListeners()
      })
    }
  }, [editor])
  return null
}

export default TablePlugin
