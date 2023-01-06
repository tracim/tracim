config = {
    # Username of the user who will be used to create warnings.
    "username": "TheAdmin",

    # Message of the warning. Note that a mention to the file's author will be appended.
    "message": "This is video is not provided in the mp4 format, therefore it is not playable from\
               Tracim's interface. Please upload this video as a mp4 file.",

    # List of extensions that should not trigger a warning.
    "ok_extensions": [
        ".mp4"
    ],

    # List of mimetypes that should not trigger a warning. Not considered for now.
    "ok_mimetypes": [
        "video/mp4"
    ],

    # List of Tracim content types supported by this plugin.
    "ok_content_types": [
        "file"
    ],

    # List of extensions that should trigger a warning.
    "nok_extensions": [
        ".gif",
        ".webp",
        ".webm",
        ".mkv",
        ".flv",
        ".vob",
        ".ogv",
        ".ogg",
        ".rrc",
        ".gifv",
        ".mng",
        ".mov",
        ".avi",
        ".qt",
        ".wmv",
        ".yuv",
        ".rm",
        ".asf",
        ".amv",
        ".m4p",
        ".m4v",
        ".mpg",
        ".mp2",
        ".mpeg",
        ".mpe",
        ".mpv",
        ".m4v",
        ".svi",
        ".3gp",
        ".3g2",
        ".mxf",
        ".roq",
        ".nsv",
        ".flv",
        ".f4v",
        ".f4p",
        ".f4a",
        ".f4b",
        ".mod"
    ]
}
