import React from "react";
import css from "./BlogPostHeader.module.css";

export interface BlogPostHeaderProps {
	date: string;
}

export function BlogPostHeader(props: BlogPostHeaderProps) {
	return (
		<p className={css.main}>
			<img src="https://www.cyco130.com/pp.jpeg" /> Fatih Aygün
			<br />
			<small>{props.date}</small>
		</p>
	);
}
