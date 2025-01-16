async function cleanUpBotMessages({client, channelId, userProcessingMessages}){
      // begin deleting bot response messages for clean up touch
      const discordChannel = client.channels.cache.get(channelId);

      for(const messageId of userProcessingMessages){
          const message = await discordChannel.messages.fetch(messageId);
          await message.delete();
      }
}

export default cleanUpBotMessages;