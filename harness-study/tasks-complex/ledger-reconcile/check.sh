#!/bin/bash
norm() { tr -d ' `' | tr ',' '\n' | sed '/^$/d' | sort | paste -sd, -; }
[ "$(norm <<< "$3")" = "$(norm < "$2")" ]
