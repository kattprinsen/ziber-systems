// Read at call time (after dotenv has populated process.env)
export const discordConfig = {
  get botToken() { return process.env.DISCORD_BOT_TOKEN ?? '' },
  get publicKey() { return process.env.DISCORD_PUBLIC_KEY ?? '' },
  get channelId() { return process.env.DISCORD_CHANNEL_ID ?? '' },
  get commandPrefix() { return process.env.DISCORD_COMMAND_PREFIX ?? '!' },
}
