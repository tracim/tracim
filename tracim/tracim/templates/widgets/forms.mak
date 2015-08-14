<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="USER_PASSWORD_EDIT_FORM(dom_id, user, target_url)">
    <form id='${dom_id}' role="form" method="POST" action="${target_url}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title">${ICON.FA('fa-key')} ${_('Change password')}</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="currentPassword" class="control-label">${_('Current password')}</label>
                <div><input class="form-control" type="password" id="currentPassword" name="current_password" placeholder="${_('Current password')}"></div>
            </div>
            <div class="form-group">
                <label for="newPassword1" class="control-label">${_('New password')}</label>
                <div><input class="form-control" type="password" id="newPassword1" name="new_password1" placeholder="${_('New password')}"></div>
            </div>
            <div class="form-group">
                <label for="newPassword2" class="control-label">${_('Retype password')}</label>
                    <div><input class="form-control" type="password" id="newPassword2" name="new_password2" placeholder="${_('Retype password')}"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-success pull-right"><i class="fa fa-check"></i> ${_('Save changes')}</button>
            </div>
        </div>
    </form>
</%def>

<%def name="USER_PASSWORD_EDIT_FORM_NO_OLD(dom_id, user, target_url, next_url='')">
    <form id='${dom_id}' role="form" method="POST" action="${target_url}">
        <input type="hidden" name="next_url" value="${next_url}"/>
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title">${ICON.FA('fa-key')} ${_('Change password')}</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="newPassword1" class="control-label">${_('New password')}</label>
                <div><input class="form-control" type="password" id="newPassword1" name="new_password1" placeholder="${_('New password')}"></div>
            </div>
            <div class="form-group">
                <label for="newPassword2" class="control-label">${_('Retype password')}</label>
                    <div><input class="form-control" type="password" id="newPassword2" name="new_password2" placeholder="${_('Retype password')}"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-success pull-right"><i class="fa fa-check"></i> ${_('Save changes')}</button>
            </div>
        </div>
    </form>
</%def>
