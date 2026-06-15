// Read at call time (after dotenv has populated process.env)
export const discordConfig = {
  get botToken() { return process.env.DISCORD_BOT_TOKEN ?? '' },
  get publicKey() { return process.env.DISCORD_PUBLIC_KEY ?? '' },
  // Per-domain channel IDs — fall back to the legacy DISCORD_CHANNEL_ID if the
  // specific one isn't set, so existing .env files keep working unchanged.
  get plantChannelId() { return process.env.DISCORD_PLANT_CHANNEL_ID ?? process.env.DISCORD_CHANNEL_ID ?? '' },
  get taskChannelId() { return process.env.DISCORD_TASK_CHANNEL_ID ?? process.env.DISCORD_CHANNEL_ID ?? '' },
  get commandPrefix() { return process.env.DISCORD_COMMAND_PREFIX ?? '!' },
}
