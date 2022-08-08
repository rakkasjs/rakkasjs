import { Head, PageProps, StyledLink } from "rakkasjs";

export default function UserProfilePage({ params }: PageProps) {
	const activeStyle = { fontWeight: "bold" };

	return (
		<div>
			<Head title={`Hello ${params.userName}`} />
			<h1>
				Hello <span style={{ color: "green" }}>{params.userName}</span>!
			</h1>
			<nav>
				<ul>
					<li>
						<StyledLink activeStyle={activeStyle} href="/nav/Fatih">
							Fatih&apos;s profile
						</StyledLink>
					</li>
					<li>
						<StyledLink activeStyle={activeStyle} href="/nav/Dan">
							Dan&apos;s profile
						</StyledLink>
					</li>
					<li>
						<StyledLink activeStyle={activeStyle} href="/nav/Engin">
							Engin&apos;s profile
						</StyledLink>
					</li>
				</ul>
			</nav>
		</div>
	);
}
