import { TableNode } from "@lexical/table"
import { addClassNamesToElement } from "@lexical/utils"
import { NodeKey, EditorConfig } from "lexical"

// @ts-ignore
class CustomTableNode extends TableNode {
  // how exactly is getType being used? how does it's type name affect deserialization?
  static getType() {
    return "table"
  }

  static clone(node: CustomTableNode): CustomTableNode {
    return new CustomTableNode(node.__width, node.__key)
  }

  constructor(width: number, key?: NodeKey) {
    super(key)
    /*
     Note about double underscore naming from Lexical's documentation: 
     
     "By convention, we prefix properties with __ (double underscore) so that it makes it clear that these
     properties are private and their access should be avoided directly. We opted for __ instead of _ 
     because of the fact that some build tooling mangles and minifies single _ prefixed properties to improve
     code size. However, this breaks down if you're exposing a node to be extended outside of your build."
     
    */
    this.__width = width
  }

  createDOM(config: EditorConfig) {
    const tableElement = document.createElement("table")
    addClassNamesToElement(tableElement, config.theme.table)
    tableElement.style.width = `${this.__width}px`
    return tableElement
  }
}

export default CustomTableNode
