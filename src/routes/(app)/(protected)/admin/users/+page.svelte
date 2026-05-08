<script>
	import { app } from '$lib/schema';
	import { QuerySubscription } from 'jazz-tools/svelte';

	const users = new QuerySubscription(app.better_auth_user.where({}));
</script>

<table>
	<thead>
		<tr>
			<th>Id</th>
			<th>GH Username</th>
			<th>Display Name</th>
		</tr>
	</thead>
	<tbody>
		{#each users.current as user}
			<tr>
				<td>{user.id}</td>
				<td>{user.githubUsername}</td>
				<td>{user.name}</td>
			</tr>
		{/each}
	</tbody>
</table>
