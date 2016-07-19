## -*- coding: utf-8 -*-

${_('An administrator just create account for you on {website_title}'.format(
    website_title=CFG.WEBSITE_TITLE
))}

* ${_('Login')}: ${user.email}
* ${_('Password')}: ${password}

${_('To go to {website_title}, please click on following link'.format(
    website_title=CFG.WEBSITE_TITLE
))}

${login_url}

--------------------------------------------------------------------------------

This email was sent by *Tracim*,
a collaborative software developped by Algoo.

**Algoo SAS**
9 rue du rocher de Lorzier
38430 Moirans
France
http://algoo.fr
