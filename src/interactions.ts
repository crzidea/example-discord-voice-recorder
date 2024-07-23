import { entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { Client, CommandInteraction, GuildMember, Snowflake } from 'discord.js';
import { createListeningStream } from './createListeningStream';

async function join(
	interaction: CommandInteraction,
	_recordable: Set<Snowflake>,
	client: Client,
	connection?: VoiceConnection,
) {
	await interaction.deferReply();
	if (!connection) {
		if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
			const channel = interaction.member.voice.channel;
			console.log(`👂 Joining voice channel ${channel.id}`);
			connection = joinVoiceChannel({
				channelId: channel.id,
				guildId: channel.guild.id,
				selfDeaf: false,
				selfMute: false,
				debug: true,
				// @ts-expect-error Currently voice is built in mind with API v10 whereas discord.js v13 uses API v9.
				adapterCreator: channel.guild.voiceAdapterCreator,
			});
			connection.on('debug', console.log);
		} else {
			await interaction.followUp('Join a voice channel and then try that again!');
			return;
		}
	}

	const retryTimes = 3;
	try {
		const channelId = connection.joinConfig.channelId ?? '';
		// await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
		async function tryJoin(connection: VoiceConnection, times: number) {
			try {
				await entersState(connection, VoiceConnectionStatus.Ready, 3e3);
				console.log(`👂 Joined voice channel ${channelId}`);
				await interaction.editReply('Ready!');
			} catch (error) {
				if (times > 0) {
					console.warn(`👂 Failed to join voice channel ${channelId} after ${4 - times} times, trying again`);
					await interaction.editReply({
						content: `👂 Failed to join voice channel after ${4 - times} times, trying again`,
					});
					connection.rejoin();
					await tryJoin(connection, times - 1);
				} else {
					await interaction.editReply({
						content: `Failed to join voice channel within ${retryTimes} times, please try again later!`,
					});
					connection.destroy();
					throw error;
				}
			}
		}
		await tryJoin(connection, retryTimes);

		const receiver = connection.receiver;

		receiver.speaking.on('start', (userId) => {
			// if (recordable.has(userId)) {
			console.log(`👂 ${userId} started speaking`);
			createListeningStream(receiver, userId, client.users.cache.get(userId));
			// }
		});
		receiver.speaking.on('end', (userId) => {
			console.log(`👂 ${userId} stopped speaking`);
		});
	} catch (error) {
		console.warn(error);
	}
}

async function record(
	interaction: CommandInteraction,
	_recordable: Set<Snowflake>,
	client: Client,
	connection?: VoiceConnection,
) {
	if (connection) {
		const userId = interaction.options.get('speaker')!.value! as Snowflake;
		// recordable.add(userId);

		const receiver = connection.receiver;
		// if (connection.receiver.speaking.users.has(userId)) {
		createListeningStream(receiver, userId, client.users.cache.get(userId));
		// }

		await interaction.reply({ ephemeral: true, content: 'Listening!' });
	} else {
		await interaction.reply({ ephemeral: true, content: 'Join a voice channel and then try that again!' });
	}
}

async function leave(
	interaction: CommandInteraction,
	_recordable: Set<Snowflake>,
	_client: Client,
	connection?: VoiceConnection,
) {
	if (connection) {
		connection.disconnect();
		connection.destroy();
		// recordable.clear();
		await interaction.reply({ ephemeral: true, content: 'Left the channel!' });
	} else {
		await interaction.reply({ ephemeral: true, content: 'Not playing in this server!' });
	}
}

export const interactionHandlers = new Map<
	string,
	(
		interaction: CommandInteraction,
		recordable: Set<Snowflake>,
		client: Client,
		connection?: VoiceConnection,
	) => Promise<void>
>();
interactionHandlers.set('join', join);
interactionHandlers.set('record', record);
interactionHandlers.set('leave', leave);
