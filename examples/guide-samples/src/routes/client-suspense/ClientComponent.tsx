export default function ClientComponent() {
	return (
		<div>
			<h1>Hello from client</h1>
			<p>
				This component cannot be server-side rendered because it uses
				window.location which is only available on the client.
			</p>
			<p>window.location.href = {window.location.href}</p>
		</div>
	);
}
