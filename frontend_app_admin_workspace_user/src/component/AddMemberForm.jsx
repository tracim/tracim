import React from 'react'

export const AddMemberForm = props =>
  <form className='adminUserPage__adduser__form'>
    <div className='adminUserPage__adduser__form__username'>
      <label className='username__text' htmlFor='adduser'>
        Ajouter un membre
      </label>

      <input
        type='text'
        className='username__input form-control'
        id='adduser'
        placeholder='Nom ou Email'
      />

      <div className='username__createaccount'>
        <input type='radio' id='createuseraccount' />
        <label className='ml-2' htmlFor='createuseraccount'>Create an account for this member</label>
      </div>
    </div>

    <div className='adminUserPage__adduser__form__userrole'>
      <div className='userrole__text'>
        Choose the role of the member
      </div>

      <div className='userrole__role'>
        <div className='userrole__role__workspacemanager mt-3 d-flex align-items-center'>
          <input type='radio' name='adminuser' />
          <div className='d-flex align-items-center'>
            <div className='userrole__role__icon mx-2'>
              <i className='fa fa-fw fa-gavel' />
            </div>
            Workspace manager
          </div>
        </div>
        <div className='userrole__role__contentmanager mt-3 d-flex align-items-center'>
          <input type='radio' name='adminuser' />
          <div className='d-flex align-items-center'>
            <div className='userrole__role__icon mx-2'>
              <i className='fa fa-fw fa-graduation-cap' />
            </div>
            Content manager
          </div>
        </div>
        <div className='userrole__role__contributor mt-3 d-flex align-items-center'>
          <input type='radio' name='adminuser' />
          <div className='d-flex align-items-center'>
            <div className='userrole__role__icon mx-2'>
              <i className='fa fa-fw fa-pencil' />
            </div>
            Contributor
          </div>
        </div>
        <div className='userrole__role__reader mt-3 d-flex align-items-center'>
          <input type='radio' name='adminuser' />
          <div className='d-flex align-items-center'>
            <div className='userrole__role__icon mx-2'>
              <i className='fa fa-fw fa-eye' />
            </div>
            Reader
          </div>
        </div>
      </div>
    </div>
    <div className='adminUserPage__adduser__form__submit'>
      <button className='btn'>
        Add the member
      </button>
    </div>
  </form>

export default AddMemberForm
