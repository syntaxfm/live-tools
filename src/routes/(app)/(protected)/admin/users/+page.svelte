<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
</script>

<div class="table">
	<table>
		<thead>
			<tr>
				<th>GH Username</th>
				<th>Display Name</th>
				<th>Access</th>
			</tr>
		</thead>
		<tbody>
			{#each data.users as user (user.id)}
				<tr>
					<td>{user.githubUsername}</td>
					<td>{user.name}</td>
					<td>
						<form method="POST" action="?/setBan" use:enhance>
							<input type="hidden" name="userId" value={user.id} />
							<input type="hidden" name="banned" value={user.banned ? '0' : '1'} />
							<button data-variant={user.banned ? 'primary' : 'danger'} type="submit">
								{user.banned ? 'Unban' : 'Ban'}
							</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
