#!/bin/bash
# Downloads every Cypress failure screenshot from a Concourse end-to-end-tests
# build in one shot, instead of hijacking + cat'ing each file manually (see
# docs.legacy/development/test/concourse.md).
#
# Requires `fly` to be installed and already logged in to the target
# (fly -t algoo login --team-name algoo --concourse-url https://ci.algoo.fr:4443).
#
# Usage: fetch-cypress-screenshots.sh [build_id] [output_dir] [fly_target]
#
# If build_id is omitted, recent *failed* builds are listed and you're
# prompted to pick one ('m' to show more, 'a' to toggle showing all statuses).
# LIST_BUILD_COUNT (default 20) only controls how many are displayed per page;
# under the hood a much larger pool of builds is fetched (and grown further on
# 'm' if needed) so a failed build isn't missed just because other jobs filled
# up the most recent history.
#
# If output_dir is omitted, it defaults to ./cypress-screenshots-<build_id>-<build_label>,
# where build_label is the build's "name" column as shown by `fly builds`
# (e.g. tracim-pull-requests/number:6941/end-to-end-tests/5), with characters
# not safe in a directory name (/ \ : * ? " < > |) replaced by '_'.
set -e

build_id="$1"
output_dir_arg="$2"
target="${3:-algoo}"
display_page_size="${LIST_BUILD_COUNT:-20}"
raw_fetch_count=200
step_name="end-to-end-cypress-tests"
show_all_statuses=0
build_line=""

if ! command -v fly >/dev/null 2>&1; then
    echo "fly is not installed or not in PATH. See docs.legacy/development/test/concourse.md" >&2
    exit 1
fi

if [ -z "$build_id" ]; then
    while true; do
        if [ "$show_all_statuses" -eq 1 ]; then
            echo "Recent builds, all statuses (target: $target):" >&2
        else
            echo "Recent failed builds (target: $target):" >&2
        fi
        echo "" >&2

        raw_output="$(fly --print-table-headers -t "$target" builds -c "$raw_fetch_count")"
        raw_data_lines=$(( $(printf '%s\n' "$raw_output" | wc -l) - 1 ))

        if [ "$raw_data_lines" -le 0 ]; then
            echo "No builds at all found for target '$target'. Check you're logged in (see docs) and the target is correct." >&2
            exit 1
        fi

        filtered_output="$(printf '%s\n' "$raw_output" | awk -v show_all="$show_all_statuses" 'NR==1 || show_all==1 || $3=="failed"')"
        filtered_data_lines=$(( $(printf '%s\n' "$filtered_output" | wc -l) - 1 ))

        ids=()
        lines=()
        i=0
        while IFS= read -r line; do
            if [ "$i" -eq 0 ]; then
                printf "      %s\n" "$line" >&2
            elif [ "$i" -le "$display_page_size" ]; then
                printf "  %2d) %s\n" "$i" "$line" >&2
                ids+=("$(awk '{print $1}' <<< "$line")")
                lines+=("$line")
            else
                break
            fi
            i=$((i + 1))
        done <<< "$filtered_output"

        if [ "${#ids[@]}" -eq 0 ]; then
            echo "" >&2
            echo "No failed builds found among the last $raw_fetch_count builds fetched. Try 'm' to search further back, or 'a' to show all statuses." >&2
        elif [ "$filtered_data_lines" -gt "$display_page_size" ]; then
            echo "" >&2
            echo "  ... $((filtered_data_lines - display_page_size)) more not shown (press 'm' to show more)" >&2
        fi

        echo "" >&2
        read -rp "Pick a build [1-${#ids[@]}], 'm' for more, 'a' to toggle all statuses: " choice

        if [ "$choice" = "m" ]; then
            display_page_size=$((display_page_size + 20))
            if [ "$filtered_data_lines" -le "$display_page_size" ]; then
                raw_fetch_count=$((raw_fetch_count * 2))
            fi
            continue
        fi

        if [ "$choice" = "a" ]; then
            if [ "$show_all_statuses" -eq 1 ]; then
                show_all_statuses=0
            else
                show_all_statuses=1
            fi
            continue
        fi

        if [ "${#ids[@]}" -eq 0 ]; then
            echo "No builds to pick from." >&2
            exit 1
        fi

        if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#ids[@]}" ]; then
            echo "Invalid choice." >&2
            exit 1
        fi

        build_id="${ids[$((choice - 1))]}"
        build_line="${lines[$((choice - 1))]}"
        echo "Using build $build_id" >&2
        break
    done
fi

sanitize_for_dirname() {
    local input="$1" sanitized
    sanitized="$(printf '%s' "$input" | sed -E 's#[/\:*?"<>|]#_#g')"
    if [ "$sanitized" != "$input" ]; then
        echo "Warning: build label contains characters not safe for a directory name (/ \\ : * ? \" < > |); replacing them with '_'." >&2
    fi
    printf '%s' "$sanitized"
}

if [ -z "$build_line" ]; then
    build_line="$(fly -t "$target" builds -c 1000 2>/dev/null | awk -v id="$build_id" '$1==id {print; exit}')"
fi

build_label=""
if [ -n "$build_line" ]; then
    build_label="$(awk '{print $2}' <<< "$build_line")"
fi

if [ -n "$output_dir_arg" ]; then
    output_dir="$output_dir_arg"
elif [ -n "$build_label" ]; then
    output_dir="./cypress-screenshots-${build_id}-$(sanitize_for_dirname "$build_label")"
else
    output_dir="./cypress-screenshots-$build_id"
fi

hijack() {
    fly hijack -t "$target" -b "$build_id" -s "$step_name" -- "$@"
}

echo "Looking for screenshots in build $build_id (step: $step_name)..."
screenshot_paths="$(hijack /bin/sh -c "find /tmp/build -path '*functionnal_tests/cypress/screenshots/*' -type f 2>/dev/null")"

if [ -z "$screenshot_paths" ]; then
    echo "No screenshots found."
    echo "Either the build didn't fail, or its container was already garbage-collected"
    echo "(failed build containers only stick around for a short while after the build finishes)."
    exit 1
fi

mkdir -p "$output_dir"

while IFS= read -r remote_path; do
    [ -z "$remote_path" ] && continue
    relative_path="${remote_path#*cypress/screenshots/}"
    local_path="$output_dir/$relative_path"
    mkdir -p "$(dirname "$local_path")"
    echo "  fetching: $relative_path"
    hijack cat "$remote_path" < /dev/null > "$local_path"
done <<< "$screenshot_paths"

echo "Done. Screenshots saved to $output_dir"
