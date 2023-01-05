import { TableNode } from "@lexical/table"
import { addClassNamesToElement } from "@lexical/utils"
import { NodeKey, EditorConfig } from "lexical"

// should this type error just be ignored?
// it's complaining that the type of getType() should be the string "table" not a string in general
class CustomTableNode extends TableNode {
  static getType(): "table" {
    return "table"
  }

  static clone(node: CustomTableNode): CustomTableNode {
    return new CustomTableNode(node.__width, node.__key)
  }

  constructor(width: number, key?: NodeKey) {
    super(key)
    this.__width = width
  }

  createDOM(config: EditorConfig) {
    const tableElement = document.createElement("table")
    addClassNamesToElement(tableElement, config.theme.table)
    tableElement.style.width = `${this.__width}px`
    return tableElement
  }
}

export const $createCustomTableNode = (width: number): CustomTableNode =>
  new CustomTableNode(width)

export default CustomTableNode

// 1. Create Custom Table Node with __width property
// 2. Override default TableNode with CustomTableNode, this will "replace
//    all instances" of TableNode with CustomTableNode
//    Not really sure if overriding is the right move in this case?
// 3. If I add a new parameter for width to the CustomTableNode's constructor, I would
//    have rewrite TablePlugin to provide an argument, I think.
//
//  CustomTableNode doesn't know in advance how many columns it will have
//  so we have to make that calculation in the dispatch, based on the number of
//  columns. But what about
