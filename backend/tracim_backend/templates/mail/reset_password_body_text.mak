## -*- coding: utf-8 -*-

${_('Dear {user},').format(user=user.display_name)},

${_('Someone has requested to reset the password for your account on {website_title}.'.format(website_title=config.WEBSITE_TITLE))}
${_('If you did not perform this request, you can safely ignore this email.')}
${_('To reset your password, please click on following link :')}

${reset_password_url}

--------------------------------------------------------------------------------

${_("This email was sent by *Tracim*,\na collaborative software developped by Algoo.")}

**Algoo SAS**
340 Rue de l'Eygala
38430 Moirans
France
http://algoo.fr
