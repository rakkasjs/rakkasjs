import type { Page } from "rakkasjs";
import { Image, ImageProps } from "@rakkasjs/image";
import * as mypic from "../images/mypic.jpg";
import { forwardRef } from "react";

const HomePage: Page = () => {
	return (
		<main>
			<h1>Hello world!</h1>
			<Image
				src="https://cdn.shopify.com/static/sample-images/bath.jpeg"
				highPriority
				width={400}
				height={300}
				alt="A lovely bath"
				transformUrl={(src, width, quality) => {
					return `${src}?w=${width}&q=${quality}`;
				}}
			/>
			<Image
				src="https://ai.peoplebox.biz/i/bg-login-14.jpg"
				width={2400}
				height={1600}
				alt="Some random image"
			/>
			<Image image={mypic} alt="Another random image" />
		</main>
	);
};

export default HomePage;

const UnsplashImage = forwardRef<HTMLImageElement, ImageProps>(
	function UnsplashImage(
		{ transformUrl = transformUnsplashUrl, ...props },
		ref,
	) {
		return <Image {...props} transformUrl={transformUrl} ref={ref} />;
	},
);

function transformUnsplashUrl(src: string, width: number, quality: number) {
	return (
		`${src}?w=${width}&fit=min&auto=format` + (quality ? `&q=${quality}` : "")
	);
}
