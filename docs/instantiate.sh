#!/usr/bin/env sh
base_name="lp-js-module-base"
export subname="module"

script_dir () { (a="/$0"; a=${a%/*}; a=${a:-.}; a=${a#/}; echo "$a"); }

base_location="$(script_dir)/.."
export name="$1"
export project="$(pwd)/$name"
if [ -z "$name" ]; then echo "no name provided"; sleep 3; exit; fi

# setup repo
base_location_remote="$(cd "$base_location" && git remote get-url origin)"
git clone "$base_location" "$name" && cd "$name"
git remote remove origin
git remote add "$base_name"'-remote' "$base_location_remote"
git remote add "$base_name"'-local' "$base_location"
git checkout -b master

# copy data
ca_dir="$subname/container/data/ca"
if [ -d "$base_location/$ca_dir" ]; then
	mkdir -p "$ca_dir"
	ln "$base_location/$ca_dir"/* "$ca_dir"/
fi
# copying of node_modules might not work well because of links?

# rename
mv "$base_name".sublime-project "$name".sublime-project
sed -e 's/"name": "base-'"$subname"'"/"name": "'"$name"'-'"$subname"'"/' -i '' $subname/package.json

# next
echo "see $base_location/docs/setup.instantiate for next steps"; sleep 3
open "$base_location"/docs; exit # TODO: open vue-base-setup + base-setup as well?
