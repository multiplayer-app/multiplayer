import getNestedProperty from 'lodash.get'
import hasNestedProperty from 'lodash.has'
import { Notebook } from '@multiplayer/types'
import { syntaxTree } from '@codemirror/language'
import { getVariableParsedValue } from 'src/lib/utils'
import { Compartment, EditorState } from '@codemirror/state'
import { Decoration, EditorView, hoverTooltip, MatchDecorator, ViewPlugin } from '@codemirror/view'

import { VARIABLE_MATCH_REGEX } from '../../consts'
import { convertVariablesToObject, extractVariableName, getVariablesValues } from '../../utils'

const isComment = (state: EditorState, pos: number) => {
  const tree = syntaxTree(state)
  const { name } = tree.resolveInner(pos)
  return name.endsWith('Comment') || name.endsWith('comment')
}

function checkVariable(
  variableKey: string,
  vars: Record<string, Notebook.AggregateVariable>,
  values: Record<string, any>,
) {
  const key = variableKey.slice(2, -2)
  const hasKey = hasNestedProperty(values, key)
  const variable = vars[extractVariableName(variableKey)]

  const className = hasKey
    ? !variable.value
      ? 'env-variable env-variable-unknownValue'
      : `env-variable env-variable-${variable.source || 'base'}`
    : 'env-variable env-variable-unknown'

  return Decoration.mark({
    attributes: { class: className },
  })
}

const getMatchDecorator = (vars: Record<string, Notebook.AggregateVariable>, values: Record<string, any>) =>
  new MatchDecorator({
    regexp: VARIABLE_MATCH_REGEX,
    decoration: (m, view, pos) => {
      if (isComment(view.state, pos)) {
        return null
      }

      return checkVariable(m[0], vars, values)
    },
  })

export const environmentHighlightPlugin = (
  vars: Record<string, Notebook.AggregateVariable>,
  values: Record<string, any>,
) => {
  const decorator = getMatchDecorator(vars, values)

  return ViewPlugin.define(
    view => ({
      decorations: decorator.createDeco(view),
      update(u) {
        this.decorations = decorator.updateDeco(u, this.decorations)
      },
    }),
    {
      decorations: v => v.decorations,
    },
  )
}

const cursorTooltipField = (values: Record<string, any>) =>
  hoverTooltip((view, pos) => {
    const line = view.state.doc.lineAt(pos)
    const { text } = line

    const matches = [...text.matchAll(VARIABLE_MATCH_REGEX)]
    if (!matches.length) return null

    const match = matches.find(m => {
      const start = line.from + m.index!
      const end = start + m[0].length
      return pos >= start && pos <= end
    })
    if (!match) return null

    const variableKey = match[0].slice(2, -2)
    const variable = values[extractVariableName(match[0])]

    const dom = document.createElement('div')
    dom.className = 'env-tooltip'

    if (hasNestedProperty(values, variableKey)) {
      const value = getNestedProperty(values, variableKey)
      const valueEl = document.createElement('div')
      valueEl.textContent = value ? getVariableParsedValue(value) : 'Variable value is missing'
      valueEl.className = 'env-tooltip-value'

      if (variable && variable.description) {
        const descriptionEl = document.createElement('div')
        descriptionEl.textContent = variable.description
        descriptionEl.className = 'env-tooltip-description'
        dom.appendChild(descriptionEl)
      }
      dom.appendChild(valueEl)
    } else {
      dom.textContent = 'Variable not found'
    }

    return {
      pos,
      above: true,
      create() {
        return { dom }
      },
    }
  })

export class ReactiveEnvPlugin {
  private compartment = new Compartment()
  private variables: Record<string, Notebook.AggregateVariable>
  private variableValues: Record<string, any>
  constructor(vars: Notebook.AggregateVariable[]) {
    this.variables = convertVariablesToObject(vars)
    this.variableValues = getVariablesValues(vars)
  }

  handleEnvChange(editorView: EditorView, vars: Notebook.AggregateVariable[]) {
    this.variables = convertVariablesToObject(vars)
    this.variableValues = getVariablesValues(vars)

    editorView?.dispatch({
      effects: this.compartment.reconfigure([
        environmentHighlightPlugin(this.variables, this.variableValues),
        cursorTooltipField(this.variableValues),
      ]),
    })
  }

  get extension() {
    return this.compartment.of([
      environmentHighlightPlugin(this.variables, this.variableValues),
      cursorTooltipField(this.variableValues),
    ])
  }
}
