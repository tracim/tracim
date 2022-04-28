# 4.2.0 / 2022-04-28

### New Features

- The user interface is now available in Arabic
- Handle right-to-left languages on interface
- Feature improvements: Notifications, Kanban, Agenda
- UI/UX improvements (responsive, buttons, redirections)
- External links to pictures now have a preview in comments

For technical users:
- Tracimcli command lines have been added to validate custom properties schema and mail configuration validation
- Add support for anonymous LDAP and anonymous SMTP authentication has been added

### Fixed Issues

- Backend: [#3929](https://github.com/tracim/tracim/issues/3929),
[#4536](https://github.com/tracim/tracim/issues/4536),
[#4706](https://github.com/tracim/tracim/issues/4706),
[#5334](https://github.com/tracim/tracim/issues/5334),
[#5378](https://github.com/tracim/tracim/issues/5378),
[#5495](https://github.com/tracim/tracim/issues/5495),
[#5539](https://github.com/tracim/tracim/issues/5539),
[#5558](https://github.com/tracim/tracim/issues/5558)
[#5559](https://github.com/tracim/tracim/issues/5559),
- Frontend: [#4813](https://github.com/tracim/tracim/issues/4813),
[#5313](https://github.com/tracim/tracim/issues/5313),
[#5333](https://github.com/tracim/tracim/issues/5333),
[#5471](https://github.com/tracim/tracim/issues/5471),
[#5494](https://github.com/tracim/tracim/issues/5494),
[#5506](https://github.com/tracim/tracim/issues/5506),
[#5507](https://github.com/tracim/tracim/issues/5507),
[#5513](https://github.com/tracim/tracim/issues/5513),
[#5535](https://github.com/tracim/tracim/issues/5535),
[#5558](https://github.com/tracim/tracim/issues/5558),
[#5575](https://github.com/tracim/tracim/issues/5575),
[#5593](https://github.com/tracim/tracim/issues/5593)
- Documentation: [#4578](https://github.com/tracim/tracim/issues/4578),
[#4862](https://github.com/tracim/tracim/issues/4862),
[#5360](https://github.com/tracim/tracim/issues/5360),
[#5573](https://github.com/tracim/tracim/issues/5573)

### Breaking/Important change

- :warning: Radicale has been updated from version 2 to version 3.1. You need to adjust some settings before running this version if you want to be able to run Tracim. For more information see: [#5479](https://github.com/tracim/tracim/issues/5479)
- :warning: Advanced Search (Elasticsearch) has been improved. If you use it, you will need to rebuild the index. For more information see: [#5479](https://github.com/tracim/tracim/issues/5479)
- Translations are now handled via Weblate. If you want to contribute, check out this [link](https://github.com/tracim/tracim#translation)
- Language switch button moved in the account settings
- Caldav and Webdav links are displayed in the account settings
- New interface for advanced text edition (TinyMCE has been updated from version 4 to version 5.10)
- Kanban is activated by default in docker, see [#5607](https://github.com/tracim/tracim/issues/5607)
- To avoid right issues with `tracimcli` command used in the docker image, the process to properly run `tracimcli` inside official docker image has been clarified, [see here](https://github.com/tracim/tracim/blob/develop/tools_docker/README.md#tracimcli-inside-docker)
- Pyramid has been updated to 2.*, see [#5047](https://github.com/tracim/tracim/issues/5047)

### Known Issues

- Chrome performance issue for images in advanced edition, see [#5622](https://github.com/tracim/tracim/issues/5622)
- Sometimes, the header disappears on mobile, see [#5117](https://github.com/tracim/tracim/issues/5117)


# 4.1.3 / 2022-03-02

### Fixed Issues

- Frontend: [#5430](https://github.com/tracim/tracim/issues/5430),
[#5453](https://github.com/tracim/tracim/issues/5453),
[#5455](https://github.com/tracim/tracim/issues/5455)


# 4.1.2 / 2022-02-15

This maintenance release fixes a few things:
 - the experimental Docker image for arm64, broken after a setuptools update, once again works
 - on mobile devices, a workaround prevents the send button to be covered by the browser's native UI
 - a dependency has been updated, hoping this prevents the connection error popup from showing up when everything actually works correctly

### Fixed Issues

- Backend: [#5183](https://github.com/tracim/tracim/issues/5183)
- Frontend: [#5370](https://github.com/tracim/tracim/issues/5370),
[#5175](https://github.com/tracim/tracim/issues/5175)


# 4.1.1 / 2022-02-03

### Fixed Issues

- Backend: [#5263](https://github.com/tracim/tracim/issues/5263)
- Frontend: [#5286](https://github.com/tracim/tracim/issues/5286),
[#5285](https://github.com/tracim/tracim/issues/5285),
[#5315](https://github.com/tracim/tracim/issues/5315)


# 4.1.0 / 2022-01-21

### New Features

- Kanban boards
- Reactivation of the draw functionality in the collaborative document
- News feed now displays newest news first
- Crop feature for the cover and avatar profile photos
- Improvement of user's space management for the admin
- Improvement of the call feature (bugfix and polish)
- UI/UX improvement (responsive, buttons, redirections)
- Performance improvements:
  - better image and PDF preview generation
  - loading speed of spaces and users lists

### Fixed Issues

- Frontend: [#4907](https://github.com/tracim/tracim/issues/4907),
[#5136](https://github.com/tracim/tracim/issues/5136)
- Backend: [#4483](https://github.com/tracim/tracim/issues/4483),
[#4494](https://github.com/tracim/tracim/issues/4494),
[#4648](https://github.com/tracim/tracim/issues/4648),
[#4718](https://github.com/tracim/tracim/issues/4718),
[#4955](https://github.com/tracim/tracim/issues/4955),
[#4985](https://github.com/tracim/tracim/issues/4985),
[#5008](https://github.com/tracim/tracim/issues/5008)

### Breaking/Important change

- :warning: You need to adjust some settings before running this version. For more information see: [#5118](https://github.com/tracim/tracim/issues/5118)
- Poppler-utils and webp now need to be present (and qpdf can be gotten rid off) on Tracim installations that don't use Docker (PR [#5121](https://github.com/tracim/tracim/pull/5121)),
- By default, EPS previews are now disabled for security reasons, unless you manually enable them. ([see preview generator documentation](https://github.com/algoo/preview-generator#eps-support))
- Docker image support for ARM64 ([#3985](https://github.com/tracim/tracim/issues/3985))
- Allow changing the parent of a space with `tracimcli` ([#3636](https://github.com/tracim/tracim/issues/3636))
- Improve agenda discovery with caldav ([#2099](https://github.com/tracim/tracim/issues/2099))
- Address book support with carddav ([#1469](https://github.com/tracim/tracim/issues/1469))

### Known Issues

- Activation/Deactivation of agenda is not properly handled. In some cases you will not be able to remove users from spaces because of this. See the workaround in issue:([#5263](https://github.com/tracim/tracim/issues/5263#issuecomment-1016454036))
- Having a double quote (`"`) or a slash (`\`) in a kanban's title causes the kanban to not load. See: ([#5220](https://github.com/tracim/tracim/issues/5220))


# 4.0.6 / 2022-01-18

### Fixed Issues

- Backend: [#5253](https://github.com/tracim/tracim/issues/5253)


# 4.0.5 / 2021-12-29

### Fixed Issues

- CI/tests: [#5212](https://github.com/tracim/tracim/issues/5212)


# 4.0.4 / 2021-12-21

### Fixed Issues

- Docker: [#5183](https://github.com/tracim/tracim/issues/5183)


# 4.0.3 / 2021-11-22

### Fixed Issues

- Frontend: [#4995](https://github.com/tracim/tracim/issues/4995)

- Backend: [#5046](https://github.com/tracim/tracim/issues/5046),
[#5055](https://github.com/tracim/tracim/issues/5055),
[#5090](https://github.com/tracim/tracim/issues/5090),
[#5096](https://github.com/tracim/tracim/issues/5096)

# 4.0.2 / 2021-11-05

### Fixed Issues

- Frontend: [#5049](https://github.com/tracim/tracim/issues/5049)


# 4.0.1 / 2021-11-04

### Fixed Issues

- Backend: [#5048](https://github.com/tracim/tracim/issues/5048)
- Frontend: [#4895](https://github.com/tracim/tracim/issues/4895),
[#5049](https://github.com/tracim/tracim/issues/5049)


# 4.0.0 / 2021-10-29

### New Features

- 1-to-1 video calls based on Jitsi Meet
- Notification wall improvements: notification grouping, design improvement, mention highlight, etc
- Performance improvements: loading of contents, timelines...
- News feature improvements: opening News in a dedicated application, thread design, responsiveness...
- Timeline and news pagination
- UI normalization work: margins, font size, etc

### Fixed Issues

- UX: [#3649](https://github.com/tracim/tracim/issues/3649),
[#4802](https://github.com/tracim/tracim/issues/4802),
[#4872](https://github.com/tracim/tracim/issues/4872),
[#4916](https://github.com/tracim/tracim/issues/4916),
[#4918](https://github.com/tracim/tracim/issues/4918),
[#4919](https://github.com/tracim/tracim/issues/4919),
[#4951](https://github.com/tracim/tracim/issues/4951)
- App-agenda: [#4558](https://github.com/tracim/tracim/issues/4558)
- App-file: [#4056](https://github.com/tracim/tracim/issues/4056)
- App-admin: [#3689](https://github.com/tracim/tracim/issues/3689)
- Frontend: [#3978](https://github.com/tracim/tracim/issues/3978),
[#4170](https://github.com/tracim/tracim/issues/4170),
[#4440](https://github.com/tracim/tracim/issues/4440),
[#4463](https://github.com/tracim/tracim/issues/4463),
[#4666](https://github.com/tracim/tracim/issues/4666),
[#4815](https://github.com/tracim/tracim/issues/4815),
[#4826](https://github.com/tracim/tracim/issues/4826),
[#4882](https://github.com/tracim/tracim/issues/4882),
[#4929](https://github.com/tracim/tracim/issues/4929),
[#4950](https://github.com/tracim/tracim/issues/4950),
[#4969](https://github.com/tracim/tracim/issues/4969)
- Search: [#4825](https://github.com/tracim/tracim/issues/4825)
- Email: [#4912](https://github.com/tracim/tracim/issues/4912),
[#4966](https://github.com/tracim/tracim/issues/4966)
- Backend: [#4296](https://github.com/tracim/tracim/issues/4296),
[#4352](https://github.com/tracim/tracim/issues/4352),
[#4784](https://github.com/tracim/tracim/issues/4784)
- Performance: [#3628](https://github.com/tracim/tracim/issues/3628),
[#3925](https://github.com/tracim/tracim/issues/3925),
[#4837](https://github.com/tracim/tracim/issues/4837),
[#5009](https://github.com/tracim/tracim/issues/5009)
- Installation: [#3680](https://github.com/tracim/tracim/issues/3680),
[#4874](https://github.com/tracim/tracim/issues/4874)
- Docker: [#4991](https://github.com/tracim/tracim/issues/4991)

### Breaking/Important change

- :warning: Apache default configuration change. See [Migrate to 4.0.0](https://github.com/tracim/tracim/issues/5039)
- Video calls: requires a modification on existing installations. See [Migrate to 4.0.0](https://github.com/tracim/tracim/issues/5039)
- Configuration file `development.ini`: default configuration change. See [Migrate to 4.0.0](https://github.com/tracim/tracim/issues/5039)
- :warning: Python 3.5 support dropped (issue [#4874](https://github.com/tracim/tracim/issues/4874))
- Python 3.8 and 3.9 support (issue [#4874](https://github.com/tracim/tracim/issues/4874))
- Docker images now rely on Debian Bullseye (11) (issue [#4874](https://github.com/tracim/tracim/issues/4874))
- Supported OS: see [README](README.md)
- MySQL and MariaDB are not officially supported anymore (issue [#5043](https://github.com/tracim/tracim/issues/5043))
- `Publications` are now named `News` (issue [#4950](https://github.com/tracim/tracim/issues/4950))

### Known Issues

- RAW image previews are broken (issue [#5008](https://github.com/tracim/tracim/issues/5008))
- Notification call issue (issue [#5044](https://github.com/tracim/tracim/issues/5044))


# 3.9.2 / 2021-07-30

Fix installation process (broken due to the last version of Yarn).

### Fixed Issues
- Backend/Docker: [#4830](https://github.com/tracim/tracim/issues/4830)


# 3.9.1 / 2021-07-19

This stabilisation release fixes a frontend crash that happens when anchor elements with an empty or inexistent href
attribute end up in publications, notes or comments. Any user of Tracim 3.9 is strongly encouraged to update. Releases
prior to Tracim 3.9 are not affected by this crash.

### Fixed Issues
 - Frontend: [#4805](https://github.com/tracim/tracim/issues/4805)


# 3.9.0 / 2021-07-09

### New Features

For end users:
 - Links to Tracim contents. A user can now create a link to other Tracim contents in comments and notes. An
   autocompletion popup will help the user create the link as soon as they type `#` and then a word in the title
   of the content, or its id. The created link will display the title of the document, and will have a specific color
   showing it is an internal link in notes.
 - Tags on contents (notes and files). Tagging is done in the new tab between the area that shows the
   content and the timeline. Tags can be added and removed there. They are per space (spaces have different sets of
   tags). Tags of a space can be listed and managed in the space settings that a user can find in the dashboard.
   Readers cannot add or remove tags to contents or to space. Contributor can add/remove tags to/from contents, but
   cannot manage tags of a space. Space and content managers can manage tags of a space. Contents can be searched
   by tags when the advanced search feature is enabled.
 - Revamped app appearance (size and headers). Formerly, apps showing notes, topics and files didn't take the whole
   space vertically and horizontally. They also had both a header and a toolbar.
   The space and screen estate is now better used. Apps now take as much space as possible, both vertically and
   horizontally, and the header and the toolbar have been merged to put the focus on the content.
 - The valitity time of the password reset link is given in the reset password email sent when users forget their passwords
 - The autocompletion popup for mentions (and now, for links) is now correctly positioned even when the text being
   edited is scrolled.

For administrators:
 - More robust previews. Some office documents take a lot of time and resources to preview. There is now a timeout for
   previews of documents generated using LibreOffice to limit issues that can arise from this problem. For this reason,
   previews of spreadsheets are now disabled by default.
 - Easier database creation: when creating a database with `tracimcli db init`,
   the command now automatically stamps `head`, which, until now, required to run a dedicated command. It is now
   a bit easier to install a new database when installing Tracim.
 - Migration to MinIO. Instances using standard storage can now be easily be migrated
   to MinIO using the new command `tracimcli db migrate-storage`.
 - Limitation of simultaneous online users: administrators can now limit how many simultaneous users are using a Tracim
   instance. If the limit is reached, user loading tracim will be shown an error message telling them to contact
   the administrator. A custom message can be configured. This feature is disabled by default.
 - Restriction of support to specific kinds of document in Collabora Online. The support can be restricted to a
   limited set of extensions. This feature is disabled by default.

### Fixed Issues
 - Frontend: [#4692](https://github.com/tracim/tracim/issues/4692),
[#4746](https://github.com/tracim/tracim/issues/4746),
[#4766](https://github.com/tracim/tracim/issues/4766),
[#4702](https://github.com/tracim/tracim/issues/4702),
[#4701](https://github.com/tracim/tracim/issues/4701),
[#4711](https://github.com/tracim/tracim/issues/4711),
[#2594](https://github.com/tracim/tracim/issues/2594),
[#4694](https://github.com/tracim/tracim/issues/4694),
[#4709](https://github.com/tracim/tracim/issues/4709),
[#4686](https://github.com/tracim/tracim/issues/4686),
[#4692](https://github.com/tracim/tracim/issues/4692),
[#4708](https://github.com/tracim/tracim/issues/4708),
[#4707](https://github.com/tracim/tracim/issues/4707),
[#4730](https://github.com/tracim/tracim/issues/4730)

 - Backend: [#4751](https://github.com/tracim/tracim/issues/4751),
[#3559](https://github.com/tracim/tracim/issues/3559),
[#4552](https://github.com/tracim/tracim/issues/4552),
[#4713](https://github.com/tracim/tracim/issues/4713),
[#4087](https://github.com/tracim/tracim/issues/4087),
[#4685](https://github.com/tracim/tracim/issues/4685),
[#4404](https://github.com/tracim/tracim/issues/4404)

 - Backend and frontend: [#4732](https://github.com/tracim/tracim/issues/4732),
[#4680](https://github.com/tracim/tracim/issues/4680),
[#4703](https://github.com/tracim/tracim/issues/4703),
[#4700](https://github.com/tracim/tracim/issues/4700),
[#4768](https://github.com/tracim/tracim/issues/4768),
[#4712](https://github.com/tracim/tracim/issues/4712)

### Breaking/Important change

- The new tags feature adds new live message types which are excluded from web notifications by default.
  If you have customized parameter `web.notifications.excluded`, you should update it and add `tag.*,content_tag.*`.
- The template at backend/tracim_backend/templates/mail/reset_password_body_html.mak related to the password reset
  email has been updated to show the validity duration of the reset passwork link.
  If you have customized this template, you may want to update it.
- The limitation of simultaneous online users requires running an additionnal
  daemon (`daemons/user_connection_state_monitor.py`). This is done automatically in our Docker container but you
  need to run it manually if you run Tracim without using the Docker container.
  If you are running Pushpin using the our docker compose configuration, be sure to set the configuration parameter
  `live_messages.stats_zmq_uri` accordingly in `develop.ini`.
- Support for tags has been added to the advanced search feature. If you use it, you will need to rebuild the
  Elastic search index by running the following commands in the backend folder:

  ```sh
  tracimcli search index-drop
  tracimcli search index-create
  tracimcli search index-populate
  ```


# 3.8.3 / 2021-09-23

### Fixed Issues

- UX: [#4950](https://github.com/tracim/tracim/issues/4950)


# 3.8.2 / 2021-05-27

### New Features

- Add links to the public profile in the favorites page
- Configuration parameter (in server config) allows disabling the space parent input when creating a space

### Fixed Issues

- UX: [#4551](https://github.com/tracim/tracim/issues/4551)
- Frontend: [#3796](https://github.com/tracim/tracim/issues/3796),
[#4190](https://github.com/tracim/tracim/issues/4190),
[#4430](https://github.com/tracim/tracim/issues/4430),
[#4573](https://github.com/tracim/tracim/issues/4573),
[#4637](https://github.com/tracim/tracim/issues/4637),
[#4646](https://github.com/tracim/tracim/issues/4646),
[#4654](https://github.com/tracim/tracim/issues/4654)
- Misc: [#4649](https://github.com/tracim/tracim/issues/4649),
[#4656](https://github.com/tracim/tracim/issues/4656)


### Breaking/Important change

- Apache: default configuration change. You need to delete your config file `/{docker-volume}/etc/apache2.conf` (backup your file first) before starting/restarting the docker image
:warning: if you not apply this, Tracim can't show the `favicon.ico`.
- All necessary files to customize Tracim instance (logo, color) must be placed in the `branding/` folder (issue [#4606](https://github.com/tracim/tracim/issues/4606)). A `branding.sample`folder is given as an example. Some manual changes are required to run this version (same process for local installation or docker installation):
  - for Tracim >= 3.8.0
  :warning: if you not apply that, Tracim won't start and use your customization
    - First, it's necessary to backup the existing branding folder if you have added some customization (if not, it's necessary to delete the branding folder: `rm -r /{docker-volume}/etc/branding`). To do that, you need to:
      - `mv /{docker-volume}/etc/branding/ /{docker-volume}/etc/branding-back/`
      - The `branding/` folder is created automatically by Tracim if it does not exist
    - Second, start Tracim 3.8.2 and after that you need to:
      - if you have customized your `logo.png`:
        - `mv /{docker-volume}/etc/logo.png /{docker-volume}/etc/branding/images/tracim-logo.png`
      - if you have customized your `color.json`:
        - it's better to change the new `color.json` file available in `/{docker-volume}/etc/branding/` (the new key `"sidebar":` is mandatory and available by default since Tracim 3.8.1)
      - if you have customized some files in the old `branding/` folder, you need to copy your file from `/{docker-volume}/etc/branding-back/` folder
    - Finally, restart Tracim
  - for Tracim < 3.8.0, if you have customized `logo.png` and/or `color.json`
  :warning: if you not apply that, Tracim can't use your customization
    - After first start of the version 3.8.2, you need to:
      - if you have customized your `logo.png`:
        - `mv /{docker-volume}/etc/logo.png /{docker-volume}/etc/branding/images/tracim-logo.png`
      - if you have customized your `color.json`:
        - it's better to change the new `color.json` file available in `/{docker-volume}/etc/branding/` (the new key `"sidebar":` is mandatory and available by default since Tracim 3.8.1)


# 3.8.1 / 2021-05-12

### New Features

- The color of the sidebar can be configured in color.json
- Terms and conditions are displayed when a user signs in for the first time
- env_settings.md and branding.md have been documented
- A user can now create a public account
- The user interface is now available in German
- The user account interface uses explicit placeholders and labels for guidance

### Fixed Issues

- Frontend: [#3786](https://github.com/tracim/tracim/issues/3786),
[#3899](https://github.com/tracim/tracim/issues/3899),
[#4495](https://github.com/tracim/tracim/issues/4495),
[#4521](https://github.com/tracim/tracim/issues/4521),
[#4591](https://github.com/tracim/tracim/issues/4591)
- Frontend/Backend: [#4539](https://github.com/tracim/tracim/issues/4539),
[#4557](https://github.com/tracim/tracim/issues/4557),
[#4586](https://github.com/tracim/tracim/issues/4586),
[#4590](https://github.com/tracim/tracim/issues/4590)
- Backend: [#3911](https://github.com/tracim/tracim/issues/3911),
[#4587](https://github.com/tracim/tracim/issues/4587),
[#4631](https://github.com/tracim/tracim/issues/4631),
[#4632](https://github.com/tracim/tracim/issues/4632)
- Docker: [#4603](https://github.com/tracim/tracim/issues/4603)
- Documentation: [#4619](https://github.com/tracim/tracim/issues/4619)

### Breaking/Important change

- An alternative target language can be chosen for content and comment translation
- Update pushpin's version
- Update preview-generator version
- Change of the graphic charter (tracim logo, standard image for login page)


# 3.8.0 / 2021-04-27

### New Features

- Contents can be added to personal favourites
- The Home/login page can be customized
- Links in comments and publications are now previewed when possible
- Subspaces can be folded in the sidebar
- The dashboard has been improved
- Comments can be edited and removed
- User profile can now be reached from places where the user has commented something and from the member's list of a space
- There is a new button on the content page to open the gallery
- Files uploaded in a comment can now be opened as a content
- The space description is now editable using a rich text editor

### Fixed Issues

- Frontend: [#3787](https://github.com/tracim/tracim/issues/3787),
[#3811](https://github.com/tracim/tracim/issues/3811),
[#4464](https://github.com/tracim/tracim/issues/4464),
[#4532](https://github.com/tracim/tracim/issues/4532),
[#4567](https://github.com/tracim/tracim/issues/4567)
- Backend: [#4552](https://github.com/tracim/tracim/issues/4552)

### Breaking/Important change

- Some rewording (issue [#4348](https://github.com/tracim/tracim/issues/4348)):
  - `Open advanced Dashboard` is changed to `Space settings`
  - `Recent activity` and `Activity feed` is changed to `Recent activities`
  - `Click here to unsubscribe/subscribe` is changed to `Email notifications`


# 3.7.1 / 2021-04-14

### Fixed Issues

- Frontend: fix for a problem where the dashboard blinks in some cases


# 3.7.0 / 2021-04-02

### New Features

- You can create your own publications to share information with other members without creating a specific content (like a blog page).
- You can add reactions to contents using emojis like you can find on social networking platforms or instant messaging tools.
- The activity feed of a space is now visible in the dashboard and replaces the recent activity view.

### Fixed Issues

- Frontend: [#4341](https://github.com/tracim/tracim/issues/4341)

### Breaking Changes

- Database: databases that were created using Tracim v1 need to be updated manually, [more information here](https://github.com/tracim/tracim/issues/4282#issuecomment-801944438) (issue [#4266](https://github.com/tracim/tracim/issues/4266)).

### Other Changes

- This new version requires a special migration for mysql/mariadb (due to the reaction feature): [tracimcli command line](https://github.com/tracim/tracim/blob/2a6aae281046e7a10bf4c5b24dfc60f81214c709/backend/doc/cli.md#migrate-mysqlmariadb-database-to-utf8mb4-added-for-tracim-37) (issue [#4272](https://github.com/tracim/tracim/issues/4272)).
- API: this API`/api/workspaces/<workspace_id>/contents` now returns an object containing the contents in "items" instead of a direct list and also contains pagination information when the count/page_token parameters are used (issue [#4264](https://github.com/tracim/tracim/issues/4264)).
- Modification of a default value in `development.ini`: the default value for `web.notifications.excluded` has changed to a simpler syntax for `user` and adds filtering for the new notification type `reaction` (issue [#4272](https://github.com/tracim/tracim/issues/4272)).
  - On existing Tracim installations, including the official docker image: you may want to update your `development.ini` configuration file (use this file [development.ini.sample](backend/development.ini.sample) to compare).


# 3.6.1 / 2021-03-26

### Fixed Issues

- Documentation: [#4355](https://github.com/tracim/tracim/issues/4355)


# 3.6.0 / 2021-03-24

### New Features

- Advanced search available with Elasticsearch
- Translation of Note and Comment directly in Tracim using the Systran service (requires a Systran account)

### Fixed Issues

- Frontend: [#3543](https://github.com/tracim/tracim/issues/3543),
[#3575](https://github.com/tracim/tracim/issues/3575),
[#4177](https://github.com/tracim/tracim/issues/4177),
[#4218](https://github.com/tracim/tracim/issues/4218)
- UX: [#3553](https://github.com/tracim/tracim/issues/3553),
[#3557](https://github.com/tracim/tracim/issues/3557),
[#3791](https://github.com/tracim/tracim/issues/3791)
- ElasticSearch: [#4146](https://github.com/tracim/tracim/issues/4146),
[#4147](https://github.com/tracim/tracim/issues/4147),
[#4149](https://github.com/tracim/tracim/issues/4149)
- Agenda: [#3553](https://github.com/tracim/tracim/issues/3553)
- Backend: [#2114](https://github.com/tracim/tracim/issues/2114)

### Breaking Changes

- :warning: You need to migrate your database before running this version. See the *Upgrading the Database to the Last Revision* section of the [migration documentation](backend/doc/migration.md) for more information (issue [#4133](https://github.com/tracim/tracim/issues/4133)). We advise you to run this step after each upgrade of Tracim.
If you use docker image, the migration is done automatically when new image is started.
- ElasticSearch: refactor of the indexing logic.
- The `search.elasticsearch.index_alias` parameter has been renamed to `search.elasticsearch.index_alias_prefix` (issue [#4147](https://github.com/tracim/tracim/issues/4147)).
  - It is necessary to drop the existing index, create it again and populate it to use ElasticSearch, use the CLI command for that. See *Configure indexing and search to use Elasticsearch* section of the [setting documentation](backend/doc/setting.md) or see *Updating index of ElasticSearch* section of the [docker documentation](tools_docker/README.md) for more information.

#### Backend configuration file (development.ini)

- On existing Tracim installations, also if using the docker image: it is necessary to update your development.ini (use this file [development.ini.sample](backend/development.ini.sample) to compare).

### Other Changes

- Security: email addresses of users are no longer returned by API when it is not strictly necessary.
- Translation service: new parameters available in the development.ini file to activate this feature. See the *Translation feature* section of the [setting documentation](backend/doc/setting.md) for more information (issue [#4093](https://github.com/tracim/tracim/issues/4093)).


# 3.5.0 / 2021-02-11

### New Features

- All users have a parameterizable public profile
- The user interface now uses icons from Font Awesome 5

### Fixed Issues

- Frontend: [#3578](https://github.com/tracim/tracim/issues/3578),
[#3785](https://github.com/tracim/tracim/issues/3785),
[#3790](https://github.com/tracim/tracim/issues/3790),
[#3989](https://github.com/tracim/tracim/issues/3989),
[#3999](https://github.com/tracim/tracim/issues/3999),
[#4109](https://github.com/tracim/tracim/issues/4109)
- Backend: [#4130](https://github.com/tracim/tracim/issues/4130),
[#4137](https://github.com/tracim/tracim/issues/4137),
[#4142](https://github.com/tracim/tracim/issues/4142)
- Other: [#4062](https://github.com/tracim/tracim/issues/4062)

### Known Issues

- SQLite: After deleting a content/user/space directly in the database its id can be re-used (see details [here](https://sqlite.org/autoinc.html)). This can lead Tracim to display information referring to the wrong content/user/space in the notification wall and activity feed. (issue [#4016](https://github.com/tracim/tracim/issues/4016))

### Breaking Changes

- Some wordings in the user interface are changed (issue [#3901](https://github.com/tracim/tracim/issues/3901), [#4113](https://github.com/tracim/tracim/issues/4113), [#4114](https://github.com/tracim/tracim/issues/4114))
- On existing Tracim installations using the docker image: it is necessary to update your development.ini (use this file [development.ini.sample](backend/development.ini.sample) to compare). These three new parameters need to be added with this default path on your development.ini:
  - `user.custom_properties.json_schema_file_path = /tracim/backend/tracim_backend/templates/user_custom_properties/default/schema.json`
  - `user.custom_properties.ui_schema_file_path = /tracim/backend/tracim_backend/templates/user_custom_properties/default/ui.json`
  - `user.custom_properties.translations_dir_path = /tracim/backend/tracim_backend/templates/user_custom_properties/default/locale`

### Others

- Implemented an API to allow users to follow each other (issue [#3916](https://github.com/tracim/tracim/issues/3916))
- Simplified way to run tests (backend/frontend) in development environments (issue [#4020](https://github.com/tracim/tracim/issues/4020))


## 3.4.3 / 2021-01-11

### Fixed Issues

- Backend: [#4033](https://github.com/tracim/tracim/issues/4033)


## 3.4.2 / 2021-01-08

### New Features

- The personal activity feed is now the home page when you log in Tracim when you are a member of a space

### Fixed Issues

- Backend: [#3997](https://github.com/tracim/tracim/issues/3997),
[#4000](https://github.com/tracim/tracim/issues/4000)
- Doc: [#3988](https://github.com/tracim/tracim/issues/3988)


## 3.4.1 / 2020-12-23

### Fixed Issues

- Backend: [#3979](https://github.com/tracim/tracim/issues/3979)

### Breaking/Important Changes

#### Backend configuration file (development.ini)

- The `basic_setup.depot_storage_dir` parameter has been renamed to `basic_setup.uploaded_files_storage_path`
- The `depot_storage_dir` parameter has been renamed to `uploaded_files.storage.local.storage_path`
- The `depot_storage_name` parameter has been renamed to `uploaded_files.storage.storage_name`

The old parameter names are still functional but their usage is deprecated and they will be removed in a future release.


## 3.4.0 / 2020-12-21

### New Features

- Files uploaded to Tracim can now be stored on a Amazon S3 compatible server, see [backend documentation](backend/doc/setting.md#uploaded-files-storage) for details on how to configure it. This storage type will be improved to optimize preview generation from S3 stored files.
- Security improvements: restrict cookie access and enable [Content Security Policy](https://www.w3.org/TR/CSP2/) header, see [backend documentation](backend/doc/setting.md#content-security-policy) for details.

### Fixed Issues

- Frontend: [#3903](https://github.com/tracim/tracim/issues/3903)


## 3.3.1 / 2020-12-18

### Fixed Issues

- Mention: [#3722](https://github.com/tracim/tracim/issues/3722),
[#3927](https://github.com/tracim/tracim/issues/3927)
- Frontend: [#3542](https://github.com/tracim/tracim/issues/3542),
[#3809](https://github.com/tracim/tracim/issues/3809)


## 3.3.0 / 2020-12-02

### New Features

- Personal and per-space activity feeds help you keep up with what is going on in Tracim: you will be able to notice new contents, new members and other updates in real time at a glance.
- Tabs to access the dashboard, activity feed and all contents

### Fixed Issues

- Frontend: [#3772](https://github.com/tracim/tracim/issues/3772),
[#3805](https://github.com/tracim/tracim/issues/3805),
[#3813](https://github.com/tracim/tracim/issues/3813),
[#3820](https://github.com/tracim/tracim/issues/3820),
[#3847](https://github.com/tracim/tracim/issues/3847),
[#3870](https://github.com/tracim/tracim/issues/3870),
[#3877](https://github.com/tracim/tracim/issues/3877)
- Backend: [#3830](https://github.com/tracim/tracim/issues/3830)


## 3.2.2 / 2020-11-17

### Fixed Issues

- Backend: [#3836](https://github.com/tracim/tracim/issues/3836)


## 3.2.1 / 2020-11-04

### New Features

- Full implementation of spaces access types: confidential, on request and open (the type of spaces created on Tracim < 3.2.1 is confidential and retain their current access behavior)
- Allow users to discover, join and leave spaces
- New plugins available:
  - Adds every new user to all open spaces and to every newly created open space. You need to activate this plugin `tracim_backend_autoinvite` (documentation available [here](backend/official_plugins/README.md))
  - Recursively adds new members of a space to its parents with the default user role of each space. You need to activate this plugin `tracim_backend_parent_access` (documentation available [here](backend/official_plugins/README.md))
  - When a user is removed from a space, this plugin recursively removes this user from the children of this space. You need to activate this plugin `tracim_backend_child_removal` (documentation available [here](backend/official_plugins/README.md))
- Frontend dependencies are grouped, making Tracim faster to load on small connections and on older devices, and more lightweight on memory consumption. For developers and sysadmins, this also makes Tracim build faster.

### Fixed Issues

- Frontend: [#3684](https://github.com/tracim/tracim/issues/3684),
[#3693](https://github.com/tracim/tracim/issues/3693),
[#3696](https://github.com/tracim/tracim/issues/3696),
[#3706](https://github.com/tracim/tracim/issues/3706),
[#3768](https://github.com/tracim/tracim/issues/3768)
- Backend: [#3604](https://github.com/tracim/tracim/issues/3604)


## 3.2.0 / 2020-10-16

### New Features

- Spaces now can have sub-spaces  (a space can be child of another)
- The sidebar has been simplified and shows the new space hierarchy
- New access types for spaces (on request, open)
- Automatic tests can be done for the Tracim docker image (feature for developers)

### Fixed Issues

- Frontend: [#3596](https://github.com/tracim/tracim/issues/3596)
- Backend: [#3545](https://github.com/tracim/tracim/issues/3545),
[#3660](https://github.com/tracim/tracim/issues/3660)

## Known Issues

- It's not possible to close the sidebar by clicking around the icon (issue [#3693](https://github.com/tracim/tracim/issues/3693))
- Scroll bar on sidebar is not correctly integrated (issue [#3694](https://github.com/tracim/tracim/issues/3694))

### Breaking/Important change

- Renaming `Text document` app to `Note` (issue [#3621](https://github.com/tracim/tracim/issues/3621))
- Renaming `Shared space` to `Space` (issue [#3582](https://github.com/tracim/tracim/issues/3582))
- Webdav (issue [#3625](https://github.com/tracim/tracim/issues/3625)):
  - It is no longer possible to show two spaces with the same name in WebDAV. If two spaces at the same place have the same name, only the oldest space will be shown.
  - It is no longer possible to create/modify a space from WebDAV


## 3.1.5 / 2020-10-16

### Fixed Issues

- Backend: [#3685](https://github.com/tracim/tracim/issues/3685)


## 3.1.4 / 2020-10-07

### Fixed Issues

- TLM: [#3547](https://github.com/tracim/tracim/issues/3547)


## 3.1.3 / 2020-09-28

### Fixed Issues

- Notifications: [#3643](https://github.com/tracim/tracim/issues/3643)


## 3.1.2 / 2020-09-25

### New Features

- Start showing members in the mention suggestions right away
- Disable some notification types by default to unclutter the notification wall

### Fixed Issues

- Mention: [#3631](https://github.com/tracim/tracim/issues/3631)

## Known Issues

- Editing out a mention does not remove its associated metadata, which leads to an error when saving the document being edited in app text documents (issue [#3640](https://github.com/tracim/tracim/issues/3640)
- Clicking on a notification sometimes does not correctly open the associated content (issue [#3578](https://github.com/tracim/tracim/issues/3578))

### Other Changes

- New parameter `web.notifications.excluded` added in `development.ini.sample` to define what you want to exclude in notifications panel. There is no need to update your configuration file on existing installations if you want to keep the default set of excluded notifications.


## 3.1.1 / 2020-09-21

### Fixed Issues

- Mention: [#3507](https://github.com/tracim/tracim/issues/3507),
[#3548](https://github.com/tracim/tracim/issues/3548),
[#3580](https://github.com/tracim/tracim/issues/3580)
- TLM: [#3485](https://github.com/tracim/tracim/issues/3485),
[#3524](https://github.com/tracim/tracim/issues/3524),
[~~#3547~~](https://github.com/tracim/tracim/issues/3547) (Issue number added here by mistake. Issue available in 3.1.4)
- Frontend: [#3518](https://github.com/tracim/tracim/issues/3518),
[#3526](https://github.com/tracim/tracim/issues/3526),
[#3562](https://github.com/tracim/tracim/issues/3562),
[#3567](https://github.com/tracim/tracim/issues/3567)


## 3.1.0 / 2020-09-14

### New Features

- A notification wall now displays the users' notifications, who can see what's happening in Tracim at a glance. It can be opened using a button in the header bar.
- It is now possible to mention users directly using their Tracim username like this: `@username`. This matches the behavior of many widespread application chats. Mentions are visible in the notification wall.

### Fixed Issues

- UX: [#2801](https://github.com/tracim/tracim/issues/2801),
[#3314](https://github.com/tracim/tracim/issues/3314),
[#3316](https://github.com/tracim/tracim/issues/3316),
[#3331](https://github.com/tracim/tracim/issues/3331),
[#3335](https://github.com/tracim/tracim/issues/3335),
[#3342](https://github.com/tracim/tracim/issues/3342),
[#3363](https://github.com/tracim/tracim/issues/3363),
[#3481](https://github.com/tracim/tracim/issues/3481),
[#3513](https://github.com/tracim/tracim/issues/3513)
- Gallery: [#3337](https://github.com/tracim/tracim/issues/3337)
- Agenda: [#3336](https://github.com/tracim/tracim/issues/3336)
- Frontend: [#3185](https://github.com/tracim/tracim/issues/3185),
[#3374](https://github.com/tracim/tracim/issues/3374),
[#3473](https://github.com/tracim/tracim/issues/3473)
- Backend: [#3380](https://github.com/tracim/tracim/issues/3380),
[#3451](https://github.com/tracim/tracim/issues/3451),
[#3528](https://github.com/tracim/tracim/issues/3528),
[#3529](https://github.com/tracim/tracim/issues/3529)

### Breaking/Important change

- These deprecated configuration parameters (in development.ini) have been removed: user.reset_password.validity, caldav.enabled, collaborative_document_edition.activated, email.notification.from. They were already ignored in previous versions. (issue [#1483](https://github.com/tracim/tracim/issues/1483))
- The minimal PostgreSQL is now 9.6 (instead of 9.3 in previous versions of Tracim). A JSON-related bug in version 9.3 affected Tracim 3.1 and was likely fixed in version 9.4. Versions 9.4, 9.5, 9.6 also brought many related fixes, including a potential buffer overflow in its JSON parser. (issue [#3523](https://github.com/tracim/tracim/issues/3523))


## 3.0.4 / 2020-08-27

### Fixed Issues

- Frontend: [#3461](https://github.com/tracim/tracim/issues/3461)
- Backend: [#3401](https://github.com/tracim/tracim/issues/3401)


## 3.0.3 / 2020-08-25

### Fixed Issues

- Frontend: [#3409](https://github.com/tracim/tracim/issues/3409)
- Backend: [#3049](https://github.com/tracim/tracim/issues/3049),
[#3409](https://github.com/tracim/tracim/issues/3409)


## 3.0.2 / 2020-08-17

### Fixed Issues

- Frontend: [#3250](https://github.com/tracim/tracim/issues/3250)
- Gallery: [#3425](https://github.com/tracim/tracim/issues/3425)
- Backend: [#3431](https://github.com/tracim/tracim/issues/3431),
[#3436](https://github.com/tracim/tracim/issues/3436)


## 3.0.1 / 2020-08-10

### Fixed Issues

- Docker: [#3418](https://github.com/tracim/tracim/issues/3418)


## 3.0.0 / 2020-08-07

### New Features

- Tracim now automatically and instantly refreshes its interface when documents and comments are created, modified or deleted. It is not necessary to reload Tracim's web page anymore to see what changed.
- It is now possible to log in using a username instead of one's email address. Usernames will be used for mentions, a feature that will be available in the next release.
- Tracim can now be configured to allow user account creation without an email address

### Fixed Issues

- Frontend: [#2615](https://github.com/tracim/tracim/issues/2615),
[#2747](https://github.com/tracim/tracim/issues/2747),
[#2783](https://github.com/tracim/tracim/issues/2783),
[#2986](https://github.com/tracim/tracim/issues/2986),
[#2999](https://github.com/tracim/tracim/issues/2999),
[#3096](https://github.com/tracim/tracim/issues/3096),
[#3135](https://github.com/tracim/tracim/issues/3135),
[#3225](https://github.com/tracim/tracim/issues/3225),
[#3236](https://github.com/tracim/tracim/issues/3236),
[#3239](https://github.com/tracim/tracim/issues/3239),
[#3242](https://github.com/tracim/tracim/issues/3242),
[#3255](https://github.com/tracim/tracim/issues/3255),
[#3257](https://github.com/tracim/tracim/issues/3257),
[#3274](https://github.com/tracim/tracim/issues/3274),
[#3289](https://github.com/tracim/tracim/issues/3289),
[#3295](https://github.com/tracim/tracim/issues/3295),
[#3303](https://github.com/tracim/tracim/issues/3303),
[#3312](https://github.com/tracim/tracim/issues/3312),
[#3393](https://github.com/tracim/tracim/issues/3393)
- Backend: [#2939](https://github.com/tracim/tracim/issues/2939),
[#2970](https://github.com/tracim/tracim/issues/2970),
[#2979](https://github.com/tracim/tracim/issues/2979),
[#3025](https://github.com/tracim/tracim/issues/3025),
[#3050](https://github.com/tracim/tracim/issues/3050),
[#3064](https://github.com/tracim/tracim/issues/3064),
[#3091](https://github.com/tracim/tracim/issues/3091),
[#3119](https://github.com/tracim/tracim/issues/3119),
[#3231](https://github.com/tracim/tracim/issues/3231),
[#3370](https://github.com/tracim/tracim/issues/3370),
[#3373](https://github.com/tracim/tracim/issues/3373)
- Docker: [#3222](https://github.com/tracim/tracim/issues/3222),
[#3383](https://github.com/tracim/tracim/issues/3383)
- Documentation: [#3154](https://github.com/tracim/tracim/issues/3154)

### Other Changes

- Tracim frontend is now built with Yarn instead of NPM. See how to migrate your working copy of Tracim [here](https://github.com/tracim/tracim/issues/2916)

### Breaking/Important change

- API: api path `/v2/` no more exists in Tracim. Scripts using this old API path need to be changed and a configuration is needed to make some direct links visible in old emails work (issue [#1478](https://github.com/tracim/tracim/issues/1478), [#3052](https://github.com/tracim/tracim/issues/3052), [#3395](https://github.com/tracim/tracim/issues/3395))
- uWSGI: default configuration change. You need to delete your config file `/{docker-volume}/etc/tracim_*.ini` (backup your files first) before starting/restarting the docker image
- Apache: default configuration change. You need to delete your config file `/{docker-volume}/etc/apache.conf` (backup your file first) before starting/restarting the docker image
- Database: databases that were created from Tracim v1 need to be updated manually, more information here: https://github.com/tracim/tracim/issues/2785#issuecomment-660879104 (issue [#3343](https://github.com/tracim/tracim/issues/3343))
- Pushpin is now mandatory to run Tracim (pushpin is integrated by default in Tracim docker images)
- Some parameters in development.ini have been renamed, more information here https://github.com/tracim/tracim/issues/2785#issuecomment-637544988 (issue [#3100](https://github.com/tracim/tracim/issues/3100))
- The default log of the Tracim docker image is now also visible with the `docker logs` command


## 2.7.6 / 2020-07-01

### Fixed Issues

- Backend: [#3261](https://github.com/tracim/tracim/issues/3261)


## 2.7.5 / 2020-06-16

### New Features

- Allow playing video files inside Tracim (experimental)


## 2.7.4 / 2020-05-13

### Fixed Issues

- UX: [#3026](https://github.com/tracim/tracim/issues/3026)
- Backend: [#3025](https://github.com/tracim/tracim/issues/3025),
[#3043](https://github.com/tracim/tracim/issues/3043)


## 2.7.3 / 2020-05-07

### Fixed Issues

- UX: [#2993](https://github.com/tracim/tracim/issues/2993)


## 2.7.2 / 2020-05-04

### Fixed Issues

- Backend: [#2962](https://github.com/tracim/tracim/issues/2962)

### Breaking/Important change

- If you launched Tracim 2.7.0 or 2.7.1 on an existing database (≤ 2.6.3), an incorrect migration was performed. As a consequence, you need to downgrade your database to revision `ce074202abb2` before running Tracim 2.7.2. Please see the [documentation about downgrading](https://github.com/tracim/tracim/blob/master/backend/doc/migration.md#downgrading-the-database).


## 2.7.1 / 2020-04-30

### Fixed Issues

- Backend: [#2920](https://github.com/tracim/tracim/issues/2920)


## 2.7.0 / 2020-04-24

### New Features

- Support Português language

### Improvement

- Better responsiveness by improving SQL requests (issue [#697](https://github.com/tracim/tracim/issues/697))

### Fixed Issues

- General UX: [#1409](https://github.com/tracim/tracim/issues/1409),
[#1444](https://github.com/tracim/tracim/issues/1444),
[#1515](https://github.com/tracim/tracim/issues/1515),
[#1855](https://github.com/tracim/tracim/issues/1855),
[#2406](https://github.com/tracim/tracim/issues/2406),
[#2444](https://github.com/tracim/tracim/issues/2444),
[#2454](https://github.com/tracim/tracim/issues/2454),
[#2537](https://github.com/tracim/tracim/issues/2537),
[#2595](https://github.com/tracim/tracim/issues/2595),
[#2661](https://github.com/tracim/tracim/issues/2661),
[#2673](https://github.com/tracim/tracim/issues/2673),
[#2679](https://github.com/tracim/tracim/issues/2679),
[#2681](https://github.com/tracim/tracim/issues/2681),
[#2693](https://github.com/tracim/tracim/issues/2693),
[#2701](https://github.com/tracim/tracim/issues/2701),
[#2764](https://github.com/tracim/tracim/issues/2764),
[#2791](https://github.com/tracim/tracim/issues/2791)
- Frontend: [#1613](https://github.com/tracim/tracim/issues/1613),
[#2569](https://github.com/tracim/tracim/issues/2569)
- Backend: [#941](https://github.com/tracim/tracim/issues/941),
[#2631](https://github.com/tracim/tracim/issues/2631),
[#2737](https://github.com/tracim/tracim/issues/2737)
- Documentation: [#2776](https://github.com/tracim/tracim/issues/2776)
- Docker: [#2753](https://github.com/tracim/tracim/issues/2753)

### Other Changes

- The configuration file (development.ini.sample) now contains the default values used by Tracim and explanations on the settings (issue [#2204](https://github.com/tracim/tracim/issues/2204)). We advise you to be careful on existing installations when merging your configuration file with the new one.

### Breaking/Important change

- Supported databases: PostgreSQL(9.3+), MySQL(8.0.1+), MariaDB(10.3+) or SQLite(bundle with python). Older versions are no longer supported.


## 2.6.3 / 2020-04-09

### Improvement

- Better Tracim reactivity by improving Database indexing (#2787)[](https://github.com/tracim/tracim/issues/),

### Fixed Issues

- Frontend: [#2688](https://github.com/tracim/tracim/issues/2688)
- Backend: [#2687](https://github.com/tracim/tracim/issues/2687),
[#2793](https://github.com/tracim/tracim/issues/2793),
[#2811](https://github.com/tracim/tracim/issues/2811),
[#2812](https://github.com/tracim/tracim/issues/2812)

### Other Changes

- ElasticSearch: ElasticSearch: Refactor of the indexing logic. It is necessary to drop the existing index and to create it again to use ElasticSearch, use the CLI command for this (issue [#2660](https://github.com/tracim/tracim/issues/2660))

### Known Issues

- SMTP servers using implicit SSL may cause issues with Tracim. If you not activate `email.notification.smtp.use_implicit_ssl` and you use `email.processing_mode = sync`, when Tracim tries to send email, 500 errors appear after a 5 minute timeout and its also not possible to create a new account.
In next release we will add information [here](https://github.com/tracim/tracim/blob/master/backend/doc/setting.md#enabling-the-mail-notification-feature) to test your SMTP configuration with the Tracim configuration file (issue [#2827](https://github.com/tracim/tracim/issues/2827))


## 2.6.2 / 2020-03-20

### Fixed Issues

- General UX: [#1503](https://github.com/tracim/tracim/issues/1503),
[#1513](https://github.com/tracim/tracim/issues/1513),
[#2437](https://github.com/tracim/tracim/issues/2437),
[#2447](https://github.com/tracim/tracim/issues/2447),
[#2646](https://github.com/tracim/tracim/issues/2646),
[#2648](https://github.com/tracim/tracim/issues/2648)
- Frontend: [#1294](https://github.com/tracim/tracim/issues/1294),
[#2692](https://github.com/tracim/tracim/issues/2692),
[#2749](https://github.com/tracim/tracim/issues/2749)
- Documentation: [#2739](https://github.com/tracim/tracim/issues/2739)


## 2.6.1 / 2020-02-21

### Fixed Issues

- Frontend: [#2665](https://github.com/tracim/tracim/issues/2665),
[#2676](https://github.com/tracim/tracim/issues/2676),
[#2680](https://github.com/tracim/tracim/issues/2680),
[#2683](https://github.com/tracim/tracim/issues/2683)
- General UX: [#1891](https://github.com/tracim/tracim/issues/1891)
- File app: [#2669](https://github.com/tracim/tracim/issues/2669),
[#2674](https://github.com/tracim/tracim/issues/2674),
[#2676](https://github.com/tracim/tracim/issues/2676)
- Contents: [#1342](https://github.com/tracim/tracim/issues/1342)
- Sidebar: [#2665](https://github.com/tracim/tracim/issues/2665)
- Backend: [#2592](https://github.com/tracim/tracim/issues/2592)


## 2.6.0 / 2020-02-06

### New Features

- Multi-upload file available in Tracim frontend (not only in public upload)
- The titles of the pages show where you are in Tracim
- It is now possible to delete users and anonymise their data with the tracimcli command
- The preview generator now supports raw and 3D files (works with Xvfb in a Docker container)
- With Apache as a proxy, it is now possible to use the browser cache policy. If you used Tracim with Docker you need to backup and delete existing Apache configuration files in `~/tracim/etc/` (default path with Tracim Docker image). On the next startup, a new file will be created with the new parameters.
- All apps are now directly enabled/disabled with one parameter and it is now easier to develop new apps.

### Fixed Issues

- Gallery: [#2540](https://github.com/tracim/tracim/issues/2540),
[#2541](https://github.com/tracim/tracim/issues/2541),
[#2551](https://github.com/tracim/tracim/issues/2551),
[#2574](https://github.com/tracim/tracim/issues/2574),
[#2583](https://github.com/tracim/tracim/issues/2583)
- Frontend: [#1396](https://github.com/tracim/tracim/issues/1396),
[#1560](https://github.com/tracim/tracim/issues/1560),
[#1656](https://github.com/tracim/tracim/issues/1656),
[#2607](https://github.com/tracim/tracim/issues/2607),
[#2608](https://github.com/tracim/tracim/issues/2608),
[#2611](https://github.com/tracim/tracim/issues/2611),
[#2641](https://github.com/tracim/tracim/issues/2641)
- Backend: [#2588](https://github.com/tracim/tracim/issues/2588),
[#2570](https://github.com/tracim/tracim/issues/2570),
[#2610](https://github.com/tracim/tracim/issues/2610),
[#2129](https://github.com/tracim/tracim/issues/2129),
[#1484](https://github.com/tracim/tracim/issues/1484),
[#2010](https://github.com/tracim/tracim/issues/2010)

### Breaking/Important change

- `agenda`, `share_content`, `upload_permission` and `collaborative_document_edition` are now Tracim's applications (stand alone and optional), you can add/remove them from `app.enabled` list
  - `caldav.enabled` is now deprecated and agenda is enabled by default. To disable it, uncomment `app.enabled` parameter and put each enabled apps but agenda.
  - `upload_permission` and  `share_content` are enabled by default. Before 2.6.0 theses apps couldn't be disabled. To disable them, uncomment `app.enabled` parameter and put each enabled apps but `upload_permission` and/or  `share_content`.
  - `collaborative_document_edition.activated` is now deprecated and is disabled by default. To enable it, uncomment `app.enabled` parameter and put each enabled apps, including `collaborative_document_edition`
- If you use `collaborative_document_edition` with Tracim on Docker, you need to add `-e collaborative_document_edition=1` when you start docker with `docker run` command. You can also add `collaborative_document_edition=1` in your docker-compose.yml file

### Other Changes

- 2 deprecated ldap parameters: `ldap_base_url` and `ldap_base_dn` (they where not implemented in Tracim's backend code so using them had no impact)
- 2 deprecated app parameters: `caldav.enabled` and `collaborative_document_edition.activated`


## 2.5.1 / 2019-12-06

### New Features

- Custom_toolbox feature is now available - beta

### Fixed Issues

- Email: [#2565](https://github.com/tracim/tracim/issues/2565)
- Frontend: [#2345](https://github.com/tracim/tracim/issues/2345)
- Backend: [#2558](https://github.com/tracim/tracim/issues/2558)


## 2.5.0 / 2019-11-29

### New Features

- Application gallery

### Fixed Issues

- Preview-generator: [#2532](https://github.com/tracim/tracim/issues/2532)
- Backend: [#2518](https://github.com/tracim/tracim/issues/2518),
[#2526](https://github.com/tracim/tracim/issues/2526)

### Breaking change api

- remove "size" parameter from create/update/get/get all workspaces endpoint


## 2.4.5 / 2019-11-21

### New Features

- Creation of multiple shared spaces with same name
- Configure default profile of new users
- Space Limitations (experimental) - allow some controls on users allowed space, etc

### Fixed Issues

- General UX: [#2494](https://github.com/tracim/tracim/issues/2494)
- Timeline: [#2455](https://github.com/tracim/tracim/issues/2455)
- File App: [#2501](https://github.com/tracim/tracim/issues/2501)
- Backend & system: [#2392](https://github.com/tracim/tracim/issues/2392),
[#2474](https://github.com/tracim/tracim/issues/2474),
[#2475](https://github.com/tracim/tracim/issues/2475),
[#2476](https://github.com/tracim/tracim/issues/2476),
[#2477](https://github.com/tracim/tracim/issues/2477),
[#2489](https://github.com/tracim/tracim/issues/2489),
[#2500](https://github.com/tracim/tracim/issues/2500),
[#2511](https://github.com/tracim/tracim/issues/2511)

## 2.4.4 / 2019-11-13

### New Features

- Preview of 3D files (*.stl), videos (10 image per each video) are now available

### Fixed Issues

- Preview-generator: [#2503](https://github.com/tracim/tracim/issues/2503),
[#2492](https://github.com/tracim/tracim/issues/2492)

### Known Issues

- Manual modification to install Tracim on Ubuntu Trusty (14.04) is necessary (issue [#2514](https://github.com/tracim/tracim/issues/2514))


## 2.4.3 / 2019-09-26

### Fixed Issues

- Docker: [#2445](https://github.com/tracim/tracim/issues/2445)
- Content Listing: extended action button not working correctly


## 2.4.2 / 2019-09-24

### Fixed Issues
- Timeline: Missing css rule about word-break for comment


## 2.4.1 / 2019-09-20

### Fixed Issues

- Migration issue introduced with 2.4.0


## 2.4.0 / 2019-09-19

### New Features

- Online document edition through CollaboraOnline/LibreofficeOnline integration
- Public file share in download (allow remote users to access to a file stored in Tracim, eventually through a password protected access)
- Public file upload (allow remote users to upload to Tracim their files, eventually through a password protected access)
- Content meta-information panel (timeline, info) UI rework
- Space Limitations (experimental) - allow some controls on file/workspace sizes, number of workspace per user, etc

### Fixed Issues

- Content Listing: [#1986](https://github.com/tracim/tracim/issues/1986),
[#2046](https://github.com/tracim/tracim/issues/2046),
[#2232](https://github.com/tracim/tracim/issues/2232),
[#2262](https://github.com/tracim/tracim/issues/2262),
[#2360](https://github.com/tracim/tracim/issues/2360)
- File App: [#2062](https://github.com/tracim/tracim/issues/2062),
[#2174](https://github.com/tracim/tracim/issues/2174),
[#2203](https://github.com/tracim/tracim/issues/2203),
[#2265](https://github.com/tracim/tracim/issues/2265),
[#2273](https://github.com/tracim/tracim/issues/2273),
[#2294](https://github.com/tracim/tracim/issues/2294)
- Folder App: [#1918](https://github.com/tracim/tracim/issues/1918),
[#2087](https://github.com/tracim/tracim/issues/2087),
[#2191](https://github.com/tracim/tracim/issues/2191),
[#2244](https://github.com/tracim/tracim/issues/2244)
- Timeline: [#2275](https://github.com/tracim/tracim/issues/2275),
[#2276](https://github.com/tracim/tracim/issues/2276),
[#2282](https://github.com/tracim/tracim/issues/2282),
[#2300](https://github.com/tracim/tracim/issues/2300),
[#2316](https://github.com/tracim/tracim/issues/2316)
- Dashboard: [#1774](https://github.com/tracim/tracim/issues/1774),
[#2038](https://github.com/tracim/tracim/issues/2038),
[#2242](https://github.com/tracim/tracim/issues/2242)
- Search: [#1928](https://github.com/tracim/tracim/issues/1928),
[#1973](https://github.com/tracim/tracim/issues/1973)
- Backend & system: [#619](https://github.com/tracim/tracim/issues/619),
[#2105](https://github.com/tracim/tracim/issues/2105),
[#2132](https://github.com/tracim/tracim/issues/2132),
[#2154](https://github.com/tracim/tracim/issues/2154),
[#2177](https://github.com/tracim/tracim/issues/2177),
[#2224](https://github.com/tracim/tracim/issues/2224),
[#2314](https://github.com/tracim/tracim/issues/2314),
[#2354](https://github.com/tracim/tracim/issues/2354)
- Documentation: [#2117](https://github.com/tracim/tracim/issues/2117),
[#2155](https://github.com/tracim/tracim/issues/2155)
- General: [#1887](https://github.com/tracim/tracim/issues/1887),
[#1910](https://github.com/tracim/tracim/issues/1910),
[#1956](https://github.com/tracim/tracim/issues/1956),
[#1992](https://github.com/tracim/tracim/issues/1992),
[#2011](https://github.com/tracim/tracim/issues/2011),
[#2064](https://github.com/tracim/tracim/issues/2064),
[#2091](https://github.com/tracim/tracim/issues/2091),
[#2141](https://github.com/tracim/tracim/issues/2141),
[#2149](https://github.com/tracim/tracim/issues/2149)
- General UX: [#573](https://github.com/tracim/tracim/issues/573),
[#1198](https://github.com/tracim/tracim/issues/1198),
[#2076](https://github.com/tracim/tracim/issues/2076),
[#2092](https://github.com/tracim/tracim/issues/2092),
[#2096](https://github.com/tracim/tracim/issues/2096),
[#2121](https://github.com/tracim/tracim/issues/2121),
[#2159](https://github.com/tracim/tracim/issues/2159),
[#2237](https://github.com/tracim/tracim/issues/2237),
[#2299](https://github.com/tracim/tracim/issues/2299),
[#2395](https://github.com/tracim/tracim/issues/2395)

### Known Issues

- Debian 9 is released with Firefox ESR v60.8.0. In this version, long title are not limited in upload file popup (issue [#2062](https://github.com/tracim/tracim/issues/2062))
- Opening file with special characters in label on CollaboraOnline/LibreofficeOnline is not possible (issue [#2219](https://github.com/tracim/tracim/issues/2219))
- Tracim not support lock mechanism in collaborative edition (issue [#2073](https://github.com/tracim/tracim/issues/2073))

### Other Changes

Archive button not more used in Tracim. All archive buttons is hide (issue [#2347](https://github.com/tracim/tracim/issues/2347))


## 2.3.2 / 2019-08-01

### Fixed Issues

- Email notifications: [#2134](https://github.com/tracim/tracim/issues/2134)


## 2.3.1 / 2019-07-05

### Fixed Issues

- Search: [#2001](https://github.com/tracim/tracim/issues/2001),
[#2016](https://github.com/tracim/tracim/issues/2016),
[#2025](https://github.com/tracim/tracim/issues/2025)
- Docker: [#2005](https://github.com/tracim/tracim/issues/2005),
[#2054](https://github.com/tracim/tracim/issues/2054)
- Timeline: [#2032](https://github.com/tracim/tracim/issues/2032)
- Shared spaces: [#2058](https://github.com/tracim/tracim/issues/2058)
- User management: [#1470](https://github.com/tracim/tracim/issues/1470),
[#2034](https://github.com/tracim/tracim/issues/2034)
- Email: [#2036](https://github.com/tracim/tracim/issues/2036)
- Content preview: [#2022](https://github.com/tracim/tracim/issues/2022)
- Security: [#2060](https://github.com/tracim/tracim/issues/2060)


## 2.3.0 / 2019-06-21

### New Features

- Search:
  - lite search similar to Tracim v1
  - smart search base on ElasticSearch (full text) ([Documentation here](https://github.com/tracim/tracim/blob/develop/backend/doc/setting.md#search-method-using-elastic_search-tracim-23))
- Easy content move using Drag & Drop
- Lots of UX improvement

### New Features (technical)

- It's now possible to configure Tracim using environment variables ([Documentation here](https://github.com/tracim/tracim/blob/develop/backend/doc/setting.md#tracim-22-fully-supported-var))
- New licence: combination of MIT, LGPLv3 and AGPLv3
- Since 2.3 version, following services are automatically launched when Tracim start with docker:
  - Radicale (agenda)
  - WebDAV

### Migration from <= 2.2.0 to 2.3.0

- Only if you are using Docker: before starting Tracim, you need to delete files `tracim_web.ini`, `tracim_webdav.ini` and `tracim_caldav.ini` available in the default folder `~/tracim/etc` (all files are created on startup)

### Known Issues

- Debian 9 is released with Firefox ESR v60.x.x. In this version, there is a known bug with the drag & drop feature: when hovering a content over a workspace in the sidebar, only the first one gets to have its icon updated (issue [#1997](https://github.com/tracim/tracim/issues/1997))

### Fixed Issues

- Search: [#1667](https://github.com/tracim/tracim/issues/1667),
[#1668](https://github.com/tracim/tracim/issues/1668),
[#1671](https://github.com/tracim/tracim/issues/1671),
[#1904](https://github.com/tracim/tracim/issues/1904),
[#1914](https://github.com/tracim/tracim/issues/1914),
[#1923](https://github.com/tracim/tracim/issues/1923),
[#1955](https://github.com/tracim/tracim/issues/1955)
- Drag & Drop: [#789](https://github.com/tracim/tracim/issues/789),
[#1669](https://github.com/tracim/tracim/issues/1669),
[#1958](https://github.com/tracim/tracim/issues/1958),
[#1974](https://github.com/tracim/tracim/issues/1974)
- UX: [#1512](https://github.com/tracim/tracim/issues/1512),
[#1521](https://github.com/tracim/tracim/issues/1521),
[#1743](https://github.com/tracim/tracim/issues/1743),
[#1757](https://github.com/tracim/tracim/issues/1757),
[#1758](https://github.com/tracim/tracim/issues/1758),
[#1776](https://github.com/tracim/tracim/issues/1776),
[#1781](https://github.com/tracim/tracim/issues/1781),
[#1802](https://github.com/tracim/tracim/issues/1802),
[#1843](https://github.com/tracim/tracim/issues/1843),
[#1844](https://github.com/tracim/tracim/issues/1844),
[#1845](https://github.com/tracim/tracim/issues/1845),
[#1926](https://github.com/tracim/tracim/issues/1926),
[#1939](https://github.com/tracim/tracim/issues/1939),
[#1943](https://github.com/tracim/tracim/issues/1943),
[#1962](https://github.com/tracim/tracim/issues/1962),
[#1964](https://github.com/tracim/tracim/issues/1964),
[#1970](https://github.com/tracim/tracim/issues/1970),
[#1972](https://github.com/tracim/tracim/issues/1972),
[#1981](https://github.com/tracim/tracim/issues/1981),
[#1983](https://github.com/tracim/tracim/issues/1983),
[#1990](https://github.com/tracim/tracim/issues/1990)
- Agenda: [#1663](https://github.com/tracim/tracim/issues/1663),
[#1811](https://github.com/tracim/tracim/issues/1811),
[#1819](https://github.com/tracim/tracim/issues/1819),
[#1847](https://github.com/tracim/tracim/issues/1847),
[#1852](https://github.com/tracim/tracim/issues/1852),
[#1929](https://github.com/tracim/tracim/issues/1929)
- Shared space: [#1770](https://github.com/tracim/tracim/issues/1770),
[#1977](https://github.com/tracim/tracim/issues/1977)
- Content: [#1154](https://github.com/tracim/tracim/issues/1154),
[#1553](https://github.com/tracim/tracim/issues/1553),
[#1815](https://github.com/tracim/tracim/issues/1815),
[#1818](https://github.com/tracim/tracim/issues/1818)
- Backend config: [#1525](https://github.com/tracim/tracim/issues/1525),
[#1835](https://github.com/tracim/tracim/issues/1835),
[#1888](https://github.com/tracim/tracim/issues/1888),
[#1896](https://github.com/tracim/tracim/issues/1896),
[#1902](https://github.com/tracim/tracim/issues/1902),
[#1930](https://github.com/tracim/tracim/issues/1930)
- Backend: [#1109](https://github.com/tracim/tracim/issues/1109),
[#1524](https://github.com/tracim/tracim/issues/1524),
[#1661](https://github.com/tracim/tracim/issues/1661),
[#1676](https://github.com/tracim/tracim/issues/1676),
[#1812](https://github.com/tracim/tracim/issues/1812),
[#1880](https://github.com/tracim/tracim/issues/1880),
[#1866](https://github.com/tracim/tracim/issues/1866),
[#1937](https://github.com/tracim/tracim/issues/1937)
- WebDAV: [#1734](https://github.com/tracim/tracim/issues/1734),
- Docker: [#1311](https://github.com/tracim/tracim/issues/1311),
[#1441](https://github.com/tracim/tracim/issues/1441),
[#1670](https://github.com/tracim/tracim/issues/1670),
[#1860](https://github.com/tracim/tracim/issues/1860),
[#1874](https://github.com/tracim/tracim/issues/1874),
[#1933](https://github.com/tracim/tracim/issues/1933),
[#1965](https://github.com/tracim/tracim/issues/1965)
- Performance: [#696](https://github.com/tracim/tracim/issues/696),
[#1900](https://github.com/tracim/tracim/issues/1900)
- Other: , [#1045](https://github.com/tracim/tracim/issues/1045),
[#1908](https://github.com/tracim/tracim/issues/1908)

### Other Changes

website.server_name parameter is now deleted in config file and code. Not more used in Tracim.


## 2.2.0 / 2019-05-27

### New Features

- Agenda is available
- Migration of agenda from Tracim v1 to Tracim v2 is now available
- Breadcrumbs to know exactly where you are
- Links for webdav and agenda are visible in dashboard
- Link for personal agenda is visible in My account
- Timeline's revisions now shows its author

### Known Issues

- Search & filters not yet migrated from Tracim v1
- Creating a content may appear duplicated on slow network (issue [#1361](https://github.com/tracim/tracim/issues/1361))
- It's possible to rename a content or workspace with an already in use label in some special cases (issue [#1770](https://github.com/tracim/tracim/issues/1770))
- If you create shared spaces while radicale server is not running (tracimcli caldav start), the agendas are not available (issue [#1537](https://github.com/tracim/tracim/issues/1537))
- Changing parameter caldav.radicale.server.host in development.ini with specific IP address show wrong url after starting caldav (issue [#1535](https://github.com/tracim/tracim/issues/1535))
- File extension is not visible in recent activity after click on See More (issue [#1774](https://github.com/tracim/tracim/issues/1774))

### Fixed Issues

- Documentation: [#1493](https://github.com/tracim/tracim/issues/1493),
[#1612](https://github.com/tracim/tracim/issues/1612),
[#1672](https://github.com/tracim/tracim/issues/1672),
[#1751](https://github.com/tracim/tracim/issues/1751)
- Agenda: [#1181](https://github.com/tracim/tracim/issues/1181),
[#1250](https://github.com/tracim/tracim/issues/1250),
[#1486](https://github.com/tracim/tracim/issues/1486),
[#1498](https://github.com/tracim/tracim/issues/1498),
[#1527](https://github.com/tracim/tracim/issues/1527),
[#1532](https://github.com/tracim/tracim/issues/1532),
[#1533](https://github.com/tracim/tracim/issues/1533),
[#1536](https://github.com/tracim/tracim/issues/1536),
[#1539](https://github.com/tracim/tracim/issues/1539),
[#1540](https://github.com/tracim/tracim/issues/1540),
[#1545](https://github.com/tracim/tracim/issues/1545),
[#1556](https://github.com/tracim/tracim/issues/1556),
[#1573](https://github.com/tracim/tracim/issues/1573),
[#1575](https://github.com/tracim/tracim/issues/1575),
[#1577](https://github.com/tracim/tracim/issues/1577),
[#1584](https://github.com/tracim/tracim/issues/1584),
[#1600](https://github.com/tracim/tracim/issues/1600),
[#1605](https://github.com/tracim/tracim/issues/1605),
[#1608](https://github.com/tracim/tracim/issues/1608),
[#1631](https://github.com/tracim/tracim/issues/1631),
[#1644](https://github.com/tracim/tracim/issues/1644),
[#1700](https://github.com/tracim/tracim/issues/1700),
[#1723](https://github.com/tracim/tracim/issues/1723),
[#1730](https://github.com/tracim/tracim/issues/1730)
- UX: [#1374](https://github.com/tracim/tracim/issues/1374),
[#1414](https://github.com/tracim/tracim/issues/1414),
[#1516](https://github.com/tracim/tracim/issues/1516),
[#1602](https://github.com/tracim/tracim/issues/1602),
[#1718](https://github.com/tracim/tracim/issues/1718),
[#1726](https://github.com/tracim/tracim/issues/1726),
[#1731](https://github.com/tracim/tracim/issues/1731),
[#1736](https://github.com/tracim/tracim/issues/1736),
[#1746](https://github.com/tracim/tracim/issues/1746)
- Timeline: [#727](https://github.com/tracim/tracim/issues/727),
[#869](https://github.com/tracim/tracim/issues/869),
[#901](https://github.com/tracim/tracim/issues/901),
[#1371](https://github.com/tracim/tracim/issues/1371),
[#1686](https://github.com/tracim/tracim/issues/1686),
[#1786](https://github.com/tracim/tracim/issues/1786)
- Dashbord: [#871](https://github.com/tracim/tracim/issues/871),
[#1064](https://github.com/tracim/tracim/issues/1064),
[#1084](https://github.com/tracim/tracim/issues/1084),
[#1488](https://github.com/tracim/tracim/issues/1488),
[#1641](https://github.com/tracim/tracim/issues/1641),
[#1769](https://github.com/tracim/tracim/issues/1769)
- Header: [#681](https://github.com/tracim/tracim/issues/681),
[#669](https://github.com/tracim/tracim/issues/669),
[#860](https://github.com/tracim/tracim/issues/860),
[#1074](https://github.com/tracim/tracim/issues/1074),
[#1309](https://github.com/tracim/tracim/issues/1309),
[#1621](https://github.com/tracim/tracim/issues/1621),
[#1688](https://github.com/tracim/tracim/issues/1688)
- Contents: [#818](https://github.com/tracim/tracim/issues/818),
[#827](https://github.com/tracim/tracim/issues/827),
[#943](https://github.com/tracim/tracim/issues/943),
[#1067](https://github.com/tracim/tracim/issues/1067),
[#1097](https://github.com/tracim/tracim/issues/1097),
[#1105](https://github.com/tracim/tracim/issues/1105),
[#1507](https://github.com/tracim/tracim/issues/1507),
[#1509](https://github.com/tracim/tracim/issues/1509),
[#1563](https://github.com/tracim/tracim/issues/1563),
[#1624](https://github.com/tracim/tracim/issues/1624),
[#1648](https://github.com/tracim/tracim/issues/1648),
[#1693](https://github.com/tracim/tracim/issues/1693),
[#1712](https://github.com/tracim/tracim/issues/1712),
[#1745](https://github.com/tracim/tracim/issues/1745),
[#1788](https://github.com/tracim/tracim/issues/1788),
[#1804](https://github.com/tracim/tracim/issues/1804)
- Sidebar: [#1177](https://github.com/tracim/tracim/issues/1177),
[#1571](https://github.com/tracim/tracim/issues/1571)
- Backend config file: [#987](https://github.com/tracim/tracim/issues/987),
[#1475](https://github.com/tracim/tracim/issues/1475),
[#1495](https://github.com/tracim/tracim/issues/1495),
[#1550](https://github.com/tracim/tracim/issues/1550),
[#1626](https://github.com/tracim/tracim/issues/1626),
[#1665](https://github.com/tracim/tracim/issues/1665),
[#1689](https://github.com/tracim/tracim/issues/1689),
[#1690](https://github.com/tracim/tracim/issues/1690),
[#1696](https://github.com/tracim/tracim/issues/1696),
[#1752](https://github.com/tracim/tracim/issues/1752)
- Email: [#1489](https://github.com/tracim/tracim/issues/1489),
[#1491](https://github.com/tracim/tracim/issues/1491),
[#1649](https://github.com/tracim/tracim/issues/1649)
- Security related: [#1617](https://github.com/tracim/tracim/issues/1617)
- Preview-generator: [#1126](https://github.com/tracim/tracim/issues/1126),
[#1472](https://github.com/tracim/tracim/issues/1472)
- Webdav: [#1335](https://github.com/tracim/tracim/issues/1335),
[#1499](https://github.com/tracim/tracim/issues/1499),
[#1652](https://github.com/tracim/tracim/issues/1652)
- Docker image: [#1387](https://github.com/tracim/tracim/issues/1387),
[#1565](https://github.com/tracim/tracim/issues/1565),
[#1567](https://github.com/tracim/tracim/issues/1567),
[#1681](https://github.com/tracim/tracim/issues/1681),
[#1763](https://github.com/tracim/tracim/issues/1763)
- Other: [#660](https://github.com/tracim/tracim/issues/660),
[#819](https://github.com/tracim/tracim/issues/819),
[#872](https://github.com/tracim/tracim/issues/872),
[#1006](https://github.com/tracim/tracim/issues/1006),
[#1012](https://github.com/tracim/tracim/issues/1012),
[#1030](https://github.com/tracim/tracim/issues/1030),
[#1514](https://github.com/tracim/tracim/issues/1514),
[#1610](https://github.com/tracim/tracim/issues/1610),
[#1627](https://github.com/tracim/tracim/issues/1627),
[#1630](https://github.com/tracim/tracim/issues/1630),
[#1658](https://github.com/tracim/tracim/issues/1658),
[#1679](https://github.com/tracim/tracim/issues/1679),
[#1698](https://github.com/tracim/tracim/issues/1698),
[#1705](https://github.com/tracim/tracim/issues/1705),
[#1742](https://github.com/tracim/tracim/issues/1742),
[#1755](https://github.com/tracim/tracim/issues/1755)

### Other Changes

- Rename 'user.reset_password.validity' to 'user.reset_password.token_lifetime' in config, old parameter is now deprecated. (issue [#970](https://github.com/tracim/tracim/issues/970))

### REST API Changes

- Removing 'caldav_url' unused param from user returned by api(commit 3861a373e7b0039545ac65cfb7e51ca2c308f23c)


## 2.1.0 / 2019-02-15

### New Features
- Folders
- Progressive web app support (possibility to "install" Tracim on smartphone)
- Webdav + create/move operations
- Full database migration from Tracim v1
- Authentication:
    - LDAP authentication
    - Web SSO Authentication - beta (based on HTTP Headers)
    - Authentication chaining - beta (internal, ldap, apache)

### Known Issues

- Calendar support still missing (migration from Tracim v1 will be available in Tracim 2.2 - see issue [#1181](https://github.com/tracim/tracim/issues/1181))
- Search & filtering not yet migrated from Tracim v1
- Duplicated creation of content may appear on slow network (issue [#1361](https://github.com/tracim/tracim/issues/1361))

### Fixed Issues

- Documentation: [#993](https://github.com/tracim/tracim/issues/993),
[#1005](https://github.com/tracim/tracim/issues/1005),
[#1211](https://github.com/tracim/tracim/issues/1211),
[#1310](https://github.com/tracim/tracim/issues/1310),
[#1337](https://github.com/tracim/tracim/issues/1337)
- Folders: [#650](https://github.com/tracim/tracim/issues/650),
[#1119](https://github.com/tracim/tracim/issues/1119),
[#1173](https://github.com/tracim/tracim/issues/1173),
[#1191](https://github.com/tracim/tracim/issues/1191),
[#1210](https://github.com/tracim/tracim/issues/1210),
[#1256](https://github.com/tracim/tracim/issues/1256),
[#1325](https://github.com/tracim/tracim/issues/1325),
[#1353](https://github.com/tracim/tracim/issues/1353)
- Shared space management: [#1069](https://github.com/tracim/tracim/issues/1069),
[#1072](https://github.com/tracim/tracim/issues/1072),
[#1100](https://github.com/tracim/tracim/issues/1100),
[#1113](https://github.com/tracim/tracim/issues/1113),
[#1174](https://github.com/tracim/tracim/issues/1174),
[#1175](https://github.com/tracim/tracim/issues/1175),
[#1194](https://github.com/tracim/tracim/issues/1194),
[#1195](https://github.com/tracim/tracim/issues/1195),
[#1197](https://github.com/tracim/tracim/issues/1197),
[#1216](https://github.com/tracim/tracim/issues/1216),
[#1243](https://github.com/tracim/tracim/issues/1243),
[#1248](https://github.com/tracim/tracim/issues/1248),
[#1252](https://github.com/tracim/tracim/issues/1252),
[#1257](https://github.com/tracim/tracim/issues/1257),
[#1358](https://github.com/tracim/tracim/issues/1358)
- Webdav: [#1166](https://github.com/tracim/tracim/issues/1166),
[#1187](https://github.com/tracim/tracim/issues/1187),
[#1312](https://github.com/tracim/tracim/issues/1312),
[#1362](https://github.com/tracim/tracim/issues/1362),
[#1376](https://github.com/tracim/tracim/issues/1376),
[#1399](https://github.com/tracim/tracim/issues/1399),
[#1419](https://github.com/tracim/tracim/issues/1419),
[#1427](https://github.com/tracim/tracim/issues/1427)
- Users management: [#1050](https://github.com/tracim/tracim/issues/1050),
[#1063](https://github.com/tracim/tracim/issues/1063),
[#1065](https://github.com/tracim/tracim/issues/1065),
[#1077](https://github.com/tracim/tracim/issues/1077),
[#1085](https://github.com/tracim/tracim/issues/1085),
[#1138](https://github.com/tracim/tracim/issues/1138),
[#1246](https://github.com/tracim/tracim/issues/1246),
[#1268](https://github.com/tracim/tracim/issues/1268),
[#1270](https://github.com/tracim/tracim/issues/1270),
[#1287](https://github.com/tracim/tracim/issues/1287),
[#1293](https://github.com/tracim/tracim/issues/1293),
[#1295](https://github.com/tracim/tracim/issues/1295),
[#1234](https://github.com/tracim/tracim/issues/1234),
[#1359](https://github.com/tracim/tracim/issues/1359),
[#1394](https://github.com/tracim/tracim/issues/1394)
- Contents: [#758](https://github.com/tracim/tracim/issues/758),
[#1058](https://github.com/tracim/tracim/issues/1058),
[#1076](https://github.com/tracim/tracim/issues/1076),
[#1107](https://github.com/tracim/tracim/issues/1107),
[#1147](https://github.com/tracim/tracim/issues/1147),
[#1148](https://github.com/tracim/tracim/issues/1148),
[#1149](https://github.com/tracim/tracim/issues/1149),
[#1150](https://github.com/tracim/tracim/issues/1150),
[#1153](https://github.com/tracim/tracim/issues/1153),
[#1190](https://github.com/tracim/tracim/issues/1190),
[#1192](https://github.com/tracim/tracim/issues/1192),
[#1196](https://github.com/tracim/tracim/issues/1196),
[#1199](https://github.com/tracim/tracim/issues/1199),
[#1206](https://github.com/tracim/tracim/issues/1206),
[#1233](https://github.com/tracim/tracim/issues/1233),
[#1236](https://github.com/tracim/tracim/issues/1236),
[#1260](https://github.com/tracim/tracim/issues/1260),
[#1360](https://github.com/tracim/tracim/issues/1360),
[#1370](https://github.com/tracim/tracim/issues/1370),
[#1373](https://github.com/tracim/tracim/issues/1373)
- Email notifications and answers: [#1167](https://github.com/tracim/tracim/issues/1167),
[#1183](https://github.com/tracim/tracim/issues/1183),
[#1184](https://github.com/tracim/tracim/issues/1184),
[#1317](https://github.com/tracim/tracim/issues/1317),
[#1319](https://github.com/tracim/tracim/issues/1319)
- Security related: [#911](https://github.com/tracim/tracim/issues/911),
[#1065](https://github.com/tracim/tracim/issues/1065),
[#1108](https://github.com/tracim/tracim/issues/1108),
[#1156](https://github.com/tracim/tracim/issues/1156)
- Server side: [#1140](https://github.com/tracim/tracim/issues/1140),
[#1142](https://github.com/tracim/tracim/issues/1142),
[#1217](https://github.com/tracim/tracim/issues/1217),
[#1249](https://github.com/tracim/tracim/issues/1249),
[#1299](https://github.com/tracim/tracim/issues/1299)
- User interface: [#765](https://github.com/tracim/tracim/issues/765),
[#913](https://github.com/tracim/tracim/issues/913),
[#1155](https://github.com/tracim/tracim/issues/1155),
[#1157](https://github.com/tracim/tracim/issues/1157),
[#1158](https://github.com/tracim/tracim/issues/1158),
[#1168](https://github.com/tracim/tracim/issues/1168),
[#1176](https://github.com/tracim/tracim/issues/1176),
[#1244](https://github.com/tracim/tracim/issues/1244),
[#1272](https://github.com/tracim/tracim/issues/1272),
[#1356](https://github.com/tracim/tracim/issues/1356),
[#1423](https://github.com/tracim/tracim/issues/1423)
- Docker image: [#1143](https://github.com/tracim/tracim/issues/1143),
[#1160](https://github.com/tracim/tracim/issues/1160),
[#1300](https://github.com/tracim/tracim/issues/1300),
[#1308](https://github.com/tracim/tracim/issues/1308),
[#1318](https://github.com/tracim/tracim/issues/1318),
[#1438](https://github.com/tracim/tracim/issues/1438)
- Other: [#1137](https://github.com/tracim/tracim/issues/1137),
[#1144](https://github.com/tracim/tracim/issues/1144),
[#1204](https://github.com/tracim/tracim/issues/1204),
[#1222](https://github.com/tracim/tracim/issues/1222)
