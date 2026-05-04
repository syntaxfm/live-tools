const MAX_TITLE_HTML_LENGTH = 200_000;

export async function getPageTitle(url: string): Promise<string | undefined> {
	const targetUrl = parseHttpUrl(url);
	const response = await fetch(targetUrl, {
		headers: {
			accept: 'text/html,application/xhtml+xml'
		},
		signal: AbortSignal.timeout(5_000)
	});

	if (!response.ok) {
		throw new Error(`Unable to fetch page title: ${response.status}`);
	}

	const contentType = response.headers.get('content-type') ?? '';

	if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
		return undefined;
	}

	return extractTitle((await response.text()).slice(0, MAX_TITLE_HTML_LENGTH));
}

function parseHttpUrl(value: string): string {
	const url = new URL(value);

	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new TypeError('Only http and https URLs are supported');
	}

	return url.toString();
}

function extractTitle(html: string): string | undefined {
	const titleMatch = /<title\b[^>]*>(?<title>[\s\S]*?)<\/title>/i.exec(html);
	const title = decodeHtmlEntities(titleMatch?.groups?.title ?? '')
		.replace(/\s+/g, ' ')
		.trim();

	return title || undefined;
}

function decodeHtmlEntities(value: string): string {
	return value
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&#39;', "'");
}
