/* eslint-disable react-hooks/rules-of-hooks */
import React, { FC, HTMLAttributes, useEffect, useContext } from "react";
import { HeadContext } from "./HeadContext";

export type HeadProps = HTMLAttributes<HTMLHeadElement>;

export const Head: FC<HeadProps> = ({ children }) => {
	let title: string | undefined;

	React.Children.map(children, (child) => {
		if (child && typeof child === "object" && "type" in child) {
			if (child.type === "title" && typeof child.props.children === "string") {
				title = child.props.children;
			}
		} else {
			console.error("Unknown child in Head component");
		}
	});

	if (import.meta.env.SSR) {
		const ctx = useContext(HeadContext);
		if (title !== undefined) ctx.title = title;
	} else {
		useEffect(() => {
			if (title !== undefined) {
				const titleElement = document.head.querySelector(
					"title[data-rakkas-head]",
				) as HTMLHeadElement | null;

				if (!titleElement) {
					document.head.innerHTML += `<title data-rakkas-head>${escapeHTML(
						title,
					)}</title>`;
				} else {
					titleElement.textContent = title;
				}
			}
		}, [title]);
	}

	return null;
};

export const escapeHTML = (str: string) => {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;");
};
