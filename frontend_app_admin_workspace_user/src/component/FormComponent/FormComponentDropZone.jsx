import React,  { useState, useCallback } from 'react'
import { useDrop } from 'react-dnd'
import TextFieldDrag from "./TextFieldDrag";
import JsonForm from '../../../../frontend_app_custom_form/src/component/JsonForm/JsonForm'

const accept = 'formComponent'
let components = []
let schema = {
  title: 'Formulaire réunion',
  type: 'object',
  required: ['title'],
  properties: {

  }
}
let c = 0

function FormComponentDropZone(props) {

  const dropItem = (item, monitor) => {
      console.log(item.id)
      //schema['hello'] = 'hello1'
      schema.properties[item.id+c] ={type: 'string', title: 'Titre de la réunion' }
      c++
      console.log(schema)
      setSchema(schema)
  }
  const [schemaV, setSchema] = useState(
    {
      title: 'Formulaire réunion',
      type: 'object',
      required: ['title'],
      properties: {

      }
    }
  );
  const [collectedProps, drop] = useDrop({
    accept,
    drop : dropItem
  })


  // this.state = {components}
  return <div ref={drop}>Déposer les composants ici<div>{components.map(id => <TextFieldDrag id = {id}/>)}</div><JsonForm schema={schemaV}/></div>
}
/*function dropItem(item, monitor) {
  console.log(item.id)
  components.push(item.id)
  console.log(components)
  // setCo
}*/

export default FormComponentDropZone
