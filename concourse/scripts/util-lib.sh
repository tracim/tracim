
# Exits the calling script with a 0 return code if no changed file matches the given arguments
# Arguments are given to grep so a regex/complex expression is possible.
# Changed files are read in concourse's resource change_files.
skip_if_no_changed_file_match() {
    if [ -f .git/resource/changed_files ] && $(egrep -q $@ .git/resource/changed_files); then
        echo "Changed files do not match $1, skipping the task."
        exit 0
    fi
}
