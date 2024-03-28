# Video Alert Plugin (tracim_backend_video_alert)

This plugin sends a comment on a video file when it is uploaded to a space, and it is not compatible with the player.

It works by checking the mimetype of the file and comparing it to a whitelist and a blacklist.
If the mimetype is in the blacklist, a comment is added to the file. The whitelist is used to bypass the blacklist.
Both lists are comma-separated lists of mimetypes. They can be used as a prefix system (i.e. `video/` will match all video files).

## Installation
```bash
# from backend directory
mkdir plugins
cd plugins
ln -s ../official_plugins/tracim_backend_video_alert .
```

## Configuration

This plugin is configured using the `.ini` file. or the environment variables.

Default configuration:
```ini
# Message of the warning. Note that a mention to the file's author will be prepended.
plugin.video_alert.message = Automatic message: the file format used is not compatible with integrated playback. Please prefer mp4 or webm format.
# Username of the user that will comment the warning. Leave blank to use the author of the file.
plugin.video_alert.username =
# List of mimetypes that should bypass the blacklist.
plugin.video_alert.whitelist = video/mp4,video/webm
# List of mimetypes that should trigger a warning
plugin.video_alert.blacklist = video/
```

Environment variables follow tracim's configuration system:
```env
TRACIM_PLUGIN__VIDEO_ALERT__MESSAGE="Automatic message: the file format used is not compatible with integrated playback. Please prefer mp4 or webm format."
TRACIM_PLUGIN__VIDEO_ALERT__USERNAME=""
TRACIM_PLUGIN__VIDEO_ALERT__WHITELIST="video/mp4,video/webm"
TRACIM_PLUGIN__VIDEO_ALERT__BLACKLIST="video/"
```
