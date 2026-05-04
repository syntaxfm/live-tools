interface AppUserProfileInput {
	email?: string | null;
	image?: string | null;
	name?: string | null;
}

export function getAppUserDisplayName(user: Pick<AppUserProfileInput, 'email' | 'name'>): string {
	const name = user.name?.trim();

	if (name) {
		return name;
	}

	const emailName = user.email?.split('@')[0]?.trim();
	return emailName || 'User';
}

export function getAppUserAvatarUrl(user: Pick<AppUserProfileInput, 'image'>): string | undefined {
	const image = user.image?.trim();
	return image || undefined;
}
