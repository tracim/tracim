#!/bin/sh
set -e
repo=$1
branch=$2
tag=$3
if ([ "$tag" != "" ] && [ "$branch" != "" ]); then
    echo "Only one of tag and branch argument should have a value"
    exit 1
elif ([ "$tag" != "" ] && [ "$branch" = "" ]); then
    echo "using the tag $tag"
    git clone -b "$tag" --single-branch "$repo" /tracim
elif ([ "$tag" = "" ] && [ "$branch" != "" ]); then
    echo "using the branch $branch"
    git clone -b "$branch" --single-branch "$repo" /tracim;
else
    echo "using the default branch (develop)"
    git clone "$repo" /tracim
fi
