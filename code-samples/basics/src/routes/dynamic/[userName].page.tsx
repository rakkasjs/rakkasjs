import { Head, PageProps } from "rakkasjs";

export default function UserProfilePage({ params }: PageProps) {
	return (
		<div>
			<Head title={`Hello ${params.userName}`} />
			<h1>
				Hello <span style={{ color: "green" }}>{params.userName}</span>!
			</h1>
			<nav>
				<ul>
					<li>
						<a href="/dynamic/Fatih">Fatih&apos;s profile</a>
					</li>
					<li>
						<a href="/dynamic/Dan">Dan&apos;s profile</a>
					</li>
					<li>
						<a href="/dynamic/Engin">Engin&apos;s profile</a>
					</li>
				</ul>
			</nav>
		</div>
	);
}
