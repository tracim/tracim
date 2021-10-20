
# return a 0 status code if a changed files summary is available and no changed filename matches
# the given argument
should_skip() {
    if [ -f .git/resource/changed_files ] && $(grep -q $1 .git/resource/changed_files); then
        echo "Changed files do not match $1"
        return 0
    fi
    return 1
}
