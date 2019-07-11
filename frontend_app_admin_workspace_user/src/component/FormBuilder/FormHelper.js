import { POSITION } from '../../helper'

const moveObjectField = (schemaRoot, schemaField, position, dragIndex, hoverIndex) => {
  let fields = Object.keys(schemaField.properties)
  const dragField = fields[dragIndex]
  fields[dragIndex] = fields[hoverIndex]
  fields[hoverIndex] = dragField
  let properties = {}
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
  let fields = Object.keys(schemaField.items.properties)
  const dragField = fields[dragIndex]
  fields[dragIndex] = fields[hoverIndex]
  fields[hoverIndex] = dragField
  let properties = {}
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
  let schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField.type === 'object') {
    return moveObjectField(schemaRoot, schemaField, position, dragIndex, hoverIndex)
  } else if (schemaField.type === 'array') {
    return moveArrayField(schemaRoot, schemaField, position, dragIndex, hoverIndex)
  }
}

export const removeField = (schema, position, label) => {
  let schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField.type === 'object') {
    delete schemaField.properties[label]
    schemaField.order.splice(schemaField.order.indexOf(label), 1)
  } else if (schemaField.type === 'array') {
    delete schemaField.items.properties[label]
    schemaField.items.order.splice(schemaField.items.order.indexOf(label), 1)
  }
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
  if (schemaField.items === undefined) schemaField.items = {type: 'object', properties: {}, order: []}
  if (schemaField.items.properties === undefined) {
    let item = schemaField.items
    let labelItem = findValidLabel(schemaRoot)
    schemaField.items = {type: 'object', properties: {[labelItem]: item}, order: [labelItem]}
  }
  let label = findValidLabel(schemaRoot)
  schemaField.items.properties[label] = {
    type: fieldType
    // label
  }
  schemaField.items.order.push(label)
}

const addFieldInObject = (schemaRoot, schemaField, fieldType) => {
  if (schemaField.order === undefined) schemaField.order = []
  let label = findValidLabel(schemaRoot)

  if (schemaField.properties === undefined) schemaField.properties = {}
  schemaField.properties[label] = {
    type: fieldType
    // label
  }
  schemaField.order.push(label)
}

export const addField = (schema, targetType, position, fieldType) => {
  // const target = targetType === 'array' ? 'items' : 'properties'
  let schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)

  if (targetType === 'array') {
    addFieldInArray(schemaRoot, schemaField, fieldType)
  } else {
    addFieldInObject(schemaRoot, schemaField, fieldType)
  }
  return schemaRoot
}

const onLabelChange = (schema, position, value, label) => {
  let schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)
  let newOrder = schemaField.order
  if (findField(schema, value) !== undefined) return undefined
  newOrder[newOrder.indexOf(label)] = value

  const tab = getTabFromField(schemaField)
  let newProperties = {}
  newOrder.forEach(p => {
    if (p === value) {
      // let property = { ...this.state.schema.properties[label] }
      let property = Object.assign({}, schemaField[tab][label])
      // property.label = value
      newProperties[value] = property
    } else {
      newProperties[p] = schemaField[tab][p]
    }
  })
  schemaField[tab] = newProperties
  return schemaRoot
}

export const onPropertiesChange = (schema, position, name, value, label) => {
  if (name === 'label') {
    return onLabelChange(schema, position, value, label)
  } else {
    return changeSchemaProperty(schema, position, label, name, value)
  }
}

const changeSchemaProperty = (schema, position, label, name, value) => {
  let schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField.type === 'object') {
    schemaField.properties[label][name] = value
  } else if (schemaField.type === 'array') {
    schemaField.items.properties[label][name] = value
  }
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
  let schemaRoot = JSON.parse(JSON.stringify(schema))
  let schemaField = getSchemaAtPosition(schemaRoot, position)
  if (schemaField.type === 'object') {
    schemaField.order = Object.keys(schemaField.properties).map(p => p)
  } else if (schemaField.type === 'array') {
    schemaField.items.order = Object.keys(schemaField.items.properties).map(p => p)
  }
  return schemaRoot
}
