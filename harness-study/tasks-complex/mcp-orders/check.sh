#!/bin/bash
got="$(tr -d ' $,' <<< "$3")"
[ "$got" = "$(tr -d ' $,' < "$2")" ]
