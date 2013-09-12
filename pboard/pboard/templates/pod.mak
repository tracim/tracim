<%def name="Button(piId, pbWithLabel, psButtonCssClass, psButtonTitle, psButtonIcon, psButtonLabel)" >
  <button id='${piId}' type="button" class="btn" title="${psButtonTitle}"><i class="${psButtonIcon}"></i>${u'' if (pbWithLabel==False) else u' %s'%(psButtonLabel)}</button>
</%def>

<%def name="SaveButton(piId, pbWithLabel=False)" >
  ${Button(piId, pbWithLabel, 'btn', _('Save'), 'icon-g-edit', _('Save'))}
</%def>
<%def name="EditButton(piId, pbWithLabel=False)" >
  ${Button(piId, pbWithLabel, 'btn', _('Edit'), 'icon-g-edit', _('Edit'))}
</%def>
<%def name='CancelButton(piId, pbWithLabel=False)'>
  ${Button(piId, pbWithLabel, 'btn', _('Cancel'), 'icon-g-ban', _('Cancel'))}
</%def>
<%def name='AddButton(piId, pbWithLabel=False, psLabel=None)'>
  ${Button(piId, pbWithLabel, 'btn', psLabel or _('New'), 'icon-g-circle-plus', psLabel or _('New'))}
</%def>

