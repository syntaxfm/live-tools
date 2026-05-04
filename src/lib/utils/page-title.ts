interface PageTitleResponse {
	title: string | null;
}

export async function fetchPageTitle(url: string): Promise<string | undefined> {
	const response = await fetch(`/api/page-title?url=${encodeURIComponent(url)}`);

	if (!response.ok) {
		return undefined;
	}

	const data = (await response.json()) as PageTitleResponse;
	const title = data.title?.trim();

	return title || undefined;
}
