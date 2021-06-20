import { Logomark } from "$lib/Logomark";
import { Logotype } from "$lib/Logotype";
import { Link } from "rakkasjs";
import React, { FC } from "react";
import css from "./Header.module.css";

export const Header: FC = () => (
	<header className={css.main}>
		<Link className={css.logo} href="/">
			<Logomark height="2em" />
			<Logotype height="2em" />
		</Link>
	</header>
);
