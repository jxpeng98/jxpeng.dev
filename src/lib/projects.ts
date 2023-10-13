import emojiRegex from 'emoji-regex';
import { log } from 'next-axiom';

import type { Project } from '~/types';

/**
 * Fetch Projects
 *
 * Make a GET request to the GitHub API to gather all repositories
 * under my `nurodev` username & then filter them down to only
 * include those that contain the `portfolio` topic
 *
 * @TODO Switch to v3 API using GraphQL to save over-fetching
 */
export async function fetchProjects(): Promise<Array<Project> | null> {
	const username = 'jxpeng98'
	const query = 'query {\n' +
		`  user(login: "${username}") {` +
		'    pinnedItems(first: 8) {\n' +
		'      edges {\n' +
		'        node {\n' +
		'          ... on Repository {\n' +
		'            name\n' +
		'            url\n' +
		'            description\n' +
		'            isArchived\n' +
		'          }\n' +
		'        }\n' +
		'      }\n' +
		'    }\n' +
		'  }\n' +
		'}\n'

	const headers = {
		'Authorization':`Bearer ${process.env.GITHUB_PAT}`,
		'Content-Type': 'application/json',
	}
	const body = JSON.stringify({query: query})
	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: headers,
		body: body
	}
	)
	// const response = await fetch('https://api.github.com/users/jxpeng98/repos', {
	// 	headers: {
	// 		...(process.env.GITHUB_PAT && {
	// 			authorization: `token ${process.env.GITHUB_PAT}`,
	// 		}),
	// 	},
	// });
	if (response.status !== 200) {
		const json = await response.json();
		console.error({ error: json });
		log.error('Failed to fetch projects', { error: json });
		return null;
	} else {
		const json = await response.json();
		// Collect the pinned repos
		const pinnedRepos = json.data.user.pinnedItems.edges.map((edge) => edge.node);

		// Map the repos and collect the information
		return pinnedRepos
			.filter((repo) => !repo.isArchived && repo.description)
			.map((repo) => {
					// Strip the emoji suffix from the repo description
					const trimmedDescription = repo.description.split(' ');
					trimmedDescription.shift();
					const description = trimmedDescription.join(' ');

					return {
						description,
						icon: ((): string => {
							if (!repo.description) return undefined;

							const char = repo.description.split(' ')[0];

							return emojiRegex().test(char) ? char : undefined;
						})(),
						homepage: repo.homepage ?? undefined,
						name: repo.name,
						post: undefined,
						template: false,
						url: repo.url.toLowerCase(),
					} as Project;
				}
			); // Add this return statement
	}
}
