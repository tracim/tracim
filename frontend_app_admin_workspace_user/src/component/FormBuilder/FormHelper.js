import { isSpecialField, POSITION } from '../../helper'

const moveObjectField = (schemaRoot, schemaField, position, dragIndex, hoverIndex) => {
  const fields = Object.keys(schemaField.properties)
  if (fields[dragIndex] === undefined || fields[hoverIndex] === undefined) return schemaRoot
  const dragField = fields[dragIndex]
  fields[dragIndex] = fields[hoverIndex]
  fields[hoverIndex] = dragField
  const properties = {}
  fields.forEach(f => {
    properties[f] = schemaField.properties[f]
  })
  schemaField.properties = properties
  const oldLabel = schemaField.order[dragIndex]
  schemaField.order[dragIndex] = schemaField.order[hoverIndex]
  schemaField.order[hoverIndex] = oldLabel
  return schemaRoot
}

const moveArrayField = (schemaRoot, schemaField, position, dragIndex, hoverIndex) => {
  const fields = Object.keys(schemaField.items.properties)
  if (fields[dragIndex] === undefined || fields[hoverIndex] === undefined) return schemaRoot
  const dragField = fields[dragIndex]
  fields[dragIndex] = fields[hoverIndex]
  fields[hoverIndex] = dragField
  const properties = {}
  fields.forEach(f => {
    properties[f] = schemaField.items.properties[f]
  })
  schemaField.items.properties = properties
  const oldLabel = schemaField.items.order[dragIndex]
  schemaField.items.order[dragIndex] = schemaField.items.order[hoverIndex]
  schemaField.items.order[hoverIndex] = oldLabel
  return schemaRoot
}

export const moveField = (schema, position, dragIndex, hoverIndex) => {
  const schemaRoot = JSON.parse(JSON.stringify(schema))
  const schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField === undefined) return schemaRoot
  if (schemaField.type === 'object') {
    return moveObjectField(schemaRoot, schemaField, position, dragIndex, hoverIndex)
  } else if (schemaField.type === 'array') {
    return moveArrayField(schemaRoot, schemaField, position, dragIndex, hoverIndex)
  }
}

export const removeField = (schema, position, label) => {
  const schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField === undefined) return schemaRoot
  if (schemaField.type === 'array') schemaField = schemaField.items
  if (schemaField.properties === undefined) return schemaRoot
  delete schemaField.properties[label]
  schemaField.order.splice(schemaField.order.indexOf(label), 1)
  if (schemaField.required) schemaField.required.splice(schemaField.required.indexOf(label), 1)
  return schemaRoot
}

const findField = (schema, label) => {
  let field
  let properties = []
  if (schema.type === 'array') {
    if (schema.items === undefined) return undefined
    if (schema.items.properties === undefined) return undefined
    properties = Object.keys(schema.items.properties)
  } else if (schema.type === 'object') {
    if (schema.properties === undefined) return undefined
    properties = Object.keys(schema.properties)
  }
  properties.forEach(p => {
    if (schema.type === 'object') {
      if (p === label) {
        field = schema.properties[p]
      }
      if (schema.properties[p].type === 'object' || schema.properties[p].type === 'array') {
        const tmpField = findField(schema.properties[p], label)
        if (tmpField !== undefined) {
          field = tmpField
        }
      }
    } else if (schema.type === 'array') {
      if (p === label) {
        field = schema.items.properties[p]
      }
      if (schema.items.properties[p].type === 'object' || schema.items.properties[p].type === 'array') {
        const tmpField = findField(schema.items.properties[p], label)
        if (tmpField !== undefined) {
          field = tmpField
        }
      }
    }
  })
  return field
}

const getSchemaAtPosition = (schema, position) => {
  if (position === POSITION.ROOT) {
    return schema
  } else {
    return findField(schema, position)
  }
}

const findValidLabel = (schema) => {
  let fieldCounter = 0
  let label = 'f_' + fieldCounter
  // get a new label which is never used
  while (findField(schema, label)) {
    label = 'f_' + fieldCounter++
  }
  return label
}

const addFieldInArray = (schemaRoot, schemaField, fieldType) => {
  if (schemaField.items === undefined) schemaField.items = { type: 'object', properties: {}, order: [] }
  if (schemaField.items.properties === undefined) {
    const item = schemaField.items
    const labelItem = findValidLabel(schemaRoot)
    schemaField.items = { type: 'object', properties: { [labelItem]: item }, order: [labelItem] }
  }
  const label = findValidLabel(schemaRoot)
  schemaField.items.properties[label] = {
    type: fieldType
    // label
  }
  schemaField.items.order.push(label)
  return label
}

const addFieldInObject = (schemaRoot, schemaField, fieldType) => {
  if (schemaField.order === undefined) schemaField.order = []
  const label = findValidLabel(schemaRoot)

  if (schemaField.properties === undefined) schemaField.properties = {}
  schemaField.properties[label] = {
    type: fieldType
    // label
  }
  schemaField.order.push(label)
  return label
}

export const addField = (schema, targetType, position, fieldType) => {
  // const target = targetType === 'array' ? 'items' : 'properties'
  const schemaRoot = JSON.parse(JSON.stringify(schema))
  const schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField === undefined) return schemaRoot
  let label = ''
  if (targetType === 'array') {
    label = addFieldInArray(schemaRoot, schemaField, fieldType)
  } else {
    label = addFieldInObject(schemaRoot, schemaField, fieldType)
  }
  return { schemaRoot, label }
}

const onLabelChange = (schema, position, value, label) => {
  const schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField === undefined) return schemaRoot
  if (schemaField.type === 'array') schemaField = schemaField.items
  const newOrder = schemaField.order
  if (findField(schema, value) !== undefined) return undefined
  newOrder[newOrder.indexOf(label)] = value

  const tab = getTabFromField(schemaField)
  const newProperties = {}
  newOrder.forEach(p => {
    if (p === value) {
      // let property = { ...this.state.schema.properties[label] }
      const property = Object.assign({}, schemaField[tab][label])
      // property.label = value
      newProperties[value] = property
    } else {
      newProperties[p] = schemaField[tab][p]
    }
  })
  schemaField[tab] = newProperties
  return schemaRoot
}

const changeRequiredFields = (schema, position, value, label) => {
  const schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField === undefined) return schemaRoot
  if (schemaField.type === 'array') schemaField = schemaField.items
  if (schemaField.required === undefined) schemaField.required = []
  if (value) {
    if (schemaField.required[label]) return schemaRoot
    schemaField.required.push(label)
  } else {
    if (!schemaField.required.includes(label)) return schemaRoot
    schemaField.required.splice(schemaField.required.indexOf(label), 1)
  }
  return schemaRoot
}

export const onPropertiesChange = (schema, position, name, value, label) => {
  if (name === 'label') {
    return onLabelChange(schema, position, value, label)
  } else if (name === 'required') {
    return changeRequiredFields(schema, position, value, label)
  } else {
    return changeSchemaProperty(schema, position, label, name, value)
  }
}

const changeSchemaProperty = (schema, position, label, name, value) => {
  const schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField === undefined) return schemaRoot
  if (schemaField.type === 'array') schemaField = schemaField.items
  schemaField.properties[label][name] = value
  return schemaRoot
}

const getTabFromField = (schema) => {
  if (schema.type === 'array') {
    return 'items'
  } else {
    return 'properties'
  }
}

export const addOrderTab = (schema, position) => {
  const schemaRoot = JSON.parse(JSON.stringify(schema))
  const schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField === undefined) return schemaRoot
  if (schemaField.type === 'object') {
    schemaField.order = Object.keys(schemaField.properties).map(p => p)
  } else if (schemaField.type === 'array') {
    schemaField.items.order = Object.keys(schemaField.items.properties).map(p => p)
  }
  return schemaRoot
}

export const changeUiSchema = (schema, uischema, position, name, value, label) => {
  const schemaRoot = JSON.parse(JSON.stringify(schema))
  const schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField === undefined) return schemaRoot
  const uiSchemaRoot = JSON.parse(JSON.stringify(uischema))
  let uiSchemaField = getUiSchemaAtPosition(uiSchemaRoot, position)
  if (schemaField.type === 'array') {
    uiSchemaField = uiSchemaField.items
  }
  if (uiSchemaField[label] === undefined) uiSchemaField[label] = {}
  if (value !== undefined && value !== '') {
    uiSchemaField[label][name] = value
  } else {
    if (uiSchemaField[label][name]) delete uiSchemaField[label][name]
  }
  return uiSchemaRoot
}

export const findFieldInUiSchema = (uiSchema, label) => {
  const keys = Object.keys(uiSchema)
  let item
  for (let i = 0; i < keys.length; i++) {
    const p = keys[i]
    if (label === p) {
      item = uiSchema[p]
    } else {
      if (typeof uiSchema[p] === 'object') item = findFieldInUiSchema(uiSchema[p], label)
    }
    if (item) return item
  }
}

export const getUiSchemaAtPosition = (uiSchema, position) => {
  if (position === POSITION.ROOT) {
    return uiSchema
  } else {
    return findFieldInUiSchema(uiSchema, position)
  }
}

export const addFieldUiSchema = (uischema, targetType, position, label, fieldType) => {
  const uiSchemaRoot = JSON.parse(JSON.stringify(uischema))
  let newObject = {}
  if (isSpecialField(fieldType)) newObject = { 'ui:field': fieldType }
  const uiSchemaField = getUiSchemaAtPosition(uiSchemaRoot, position)
  if (targetType === 'array') {
    if (uiSchemaField.items === undefined) uiSchemaField.items = {}
    uiSchemaField.items[label] = newObject
  } else {
    uiSchemaField[label] = newObject
  }
  return uiSchemaRoot
}

export const removeFieldUiSchema = (schema, uischema, position, label) => {
  const schemaRoot = JSON.parse(JSON.stringify(schema))
  const schemaField = getSchemaAtPosition(schemaRoot, position)
  const uiSchemaRoot = JSON.parse(JSON.stringify(uischema))
  let uiSchemaField = getUiSchemaAtPosition(uiSchemaRoot, position)
  if (schemaField.type === 'array') uiSchemaField = uiSchemaField.items
  delete uiSchemaField[label]
  return uiSchemaRoot
}
