#!/bin/bash

autossh -f -M 0                     \
        -o "ServerAliveInterval 30" \
        -o "ServerAliveCountMax 30" \
        -L 4040:localhost:4040      \
        sepehr@185.213.164.241 -N
