import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream';
import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import type { User } from 'discord.js';
import * as prism from 'prism-media';

const usersRecording = new Set<string>();

let recordingsDir = './recordings';
export function setRecordingsDir(dir: string | undefined) {
	if (!dir) return;
	recordingsDir = dir;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createListeningStream(receiver: VoiceReceiver, userId: string, _user?: User) {
	if (usersRecording.has(userId)) return;
	usersRecording.add(userId);

	const opusStream = receiver.subscribe(userId, {
		end: {
			// behavior: EndBehaviorType.Manual,
			behavior: EndBehaviorType.AfterSilence,
			// duration: 1000,
			duration: 30000,
		},
	});

	const oggStream = new prism.opus.OggLogicalBitstream({
		opusHead: new prism.opus.OpusHead({
			channelCount: 2,
			sampleRate: 48000,
		}),
		// pageSizeControl: {
		// 	maxPackets: 10,
		// },
	});

	const filename = `${recordingsDir}/${Date.now()}-${userId}.ogg`;

	const out = createWriteStream(filename);

	console.log(`👂 Started recording ${filename}`);

	pipeline(opusStream, oggStream, out, (err) => {
		usersRecording.delete(userId);
		if (err) {
			console.warn(`❌ Error recording file ${filename} - ${err.message}`);
		} else {
			console.log(`✅ Recorded ${filename}`);
		}
	});
}
