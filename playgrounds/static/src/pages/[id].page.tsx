import React from "react";
import { definePage, DefinePageTypes } from "rakkasjs";
import { Helmet } from "react-helmet-async";

export type ProfilePageTypes = DefinePageTypes<{
	params: { id: string };
	data: {
		profile: {
			id: number;
			givenName: string;
			familyName: string;
			dob: string;
			pob: string;
			profession: string;
			email: string;
		};
	};
}>;

export default definePage<ProfilePageTypes>({
	async load({ fetch, params }) {
		const result: ProfilePageTypes["data"] = await fetch(
			`/api/people/${params.id}`,
		).then((r) => {
			if (!r.ok)
				throw new Error(`/people/${params.id} returned status ${r.status}`);

			return r.json();
		});

		return { data: result };
	},

	Component: function ProfilePage({ data: { profile } }) {
		return (
			<div>
				<Helmet title={profile.givenName + " " + profile.familyName} />
				<h2>
					{profile.givenName} {profile.familyName}
				</h2>
				<dl>
					<dt>Given name:</dt>
					<dd>{profile.givenName}</dd>

					<dt>Family name:</dt>
					<dd>{profile.familyName}</dd>

					<dt>Dob:</dt>
					<dd>{profile.dob}</dd>

					<dt>Pob:</dt>
					<dd>{profile.pob}</dd>

					<dt>Profession:</dt>
					<dd>{profile.profession}</dd>

					<dt>Email:</dt>
					<dd>{profile.email}</dd>
				</dl>
			</div>
		);
	},
});
