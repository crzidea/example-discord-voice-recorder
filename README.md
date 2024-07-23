# 👂 Recorder Bot

This repository contains a simple Discord bot that records voice channels and saves the recordings as OGG files. It's a modified version of the example found in the Discord.js Voice Examples repository.

## Features

- Record voice channels: The bot can record audio from any voice channel it joins.
- Save recordings as OGG: Recordings are saved as OGG files in the recordings directory.
- Easy setup: The bot is easy to set up and configure.

## Usage

1. Start the bot
    ```bash
    npm install

    # Set a bot token (see example.local.env)
    cp example.local.env local.env
    $EDITOR local.env

    # Start the bot!
    . local.env
    npm start
    ```
2. **Deploy commands:** Open discord, join a text channel of your server, send `@bot !deploy`.
3. **Join a voice channel:** Join a voice channel of your server, send `/join` to let the bot join the same channel as you joined, and start recording automatically.
