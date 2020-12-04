import { Client, Guild, Message } from 'discord.js';

const client = new Client({ partials: ['CHANNEL', 'MESSAGE', 'REACTION'] });

const downvote = 'downvote';
const upvote = 'upvote';

async function fetchGuildDownvoteThreshold(guild: Guild) {
  const members = await guild.members.fetch();
  const nonBotCount = members.filter((member) => member.user.bot).size;

  return Math.floor(2 * Math.sqrt(nonBotCount));
}

client.on('messageReactionAdd', async (reaction) => {
  console.log(reaction.emoji.name);
  if (reaction.emoji.name !== downvote) {
    return;
  }

  let message: Message;

  try {
    message = await reaction.message.fetch(true);
  } catch (_) {
    console.error(`Could not fetch message ${reaction.message.id}.`);
    return;
  }

  const score = message.reactions.cache
    .filter((r) => [downvote, upvote].includes(r.emoji.name))
    .map((r) => r.count * (r.emoji.name === downvote ? -1 : 1))
    .reduce((v1, v2) => v1 + v2, 0);

  const threshold = await fetchGuildDownvoteThreshold(message.guild);

  if (score <= threshold) {
    const deletionMessage = `${message.channel} Message received a total score of ${score} and was deleted.\n\nOriginal Message:"${message.content}"`;

    message.delete({
      reason: deletionMessage,
    });

    message.author.send(deletionMessage);
  }
});

client.login(process.env.downvoteFilterBot).then(() => {
  console.log('Connected.');
});
