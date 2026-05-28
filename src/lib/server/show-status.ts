import type { ShowStatus } from '$lib/components/shows/registry-types';

// Coherence between the D1 registry (which owns liveness atomically) and the live room +
// directory DOs. Call AFTER the show's status row is written. Going live hydrates the room
// from the registry once and announces it so overlays/homepage auto-follow; leaving live
// clears the directory if this was the live show. Multi-step, DO-touching orchestration —
// shared by the create and status form actions.
export async function announceShowStatus(
	env: Env,
	showId: string,
	status: ShowStatus
): Promise<void> {
	const directory = env.SHOW_DIRECTORY.get(env.SHOW_DIRECTORY.idFromName('live'));
	if (status === 'live') {
		await env.SHOW_ROOM.get(env.SHOW_ROOM.idFromName(showId)).activate(showId);
		await directory.setLiveShow(showId);
	} else if ((await directory.getLiveShow()) === showId) {
		await directory.setLiveShow(null);
	}
}
