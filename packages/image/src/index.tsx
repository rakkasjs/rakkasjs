import { forwardRef, type ImgHTMLAttributes } from "react";

export interface ImageImport {
	default: string;
	width: number;
	height: number;
	blurData?: string;
}

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
	image?: ImageImport;
	quality?: number;
	breakpoints?: number[];
	layout?: "fullWidth" | "constrained" | "fixed";
	highPriority?: boolean;
	unoptimized?: boolean;
	unstyled?: boolean;
	transformUrl?: typeof createImageUrl;

	fetchPriority?: "auto" | "high" | "low";

	src?: string;
	width?: number;
	height?: number;
	alt: string;

	background?: string;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
	{
		image,
		src = image?.default,
		width,
		height,

		alt,

		unoptimized = false,
		transformUrl = createImageUrl,
		quality = 0,
		breakpoints = DEFAULT_BREAKPOINTS,
		layout = "constrained",
		highPriority = false,
		fetchPriority = highPriority ? "high" : "auto",

		srcSet,

		loading = highPriority ? "eager" : "lazy",
		decoding = loading === "eager" ? undefined : "async",
		sizes,
		unstyled = false,
		style,
		role = alt ? undefined : "presentation",

		background = image?.blurData
			? `url("data:image/webp;base64,${image.blurData}") center / cover no-repeat`
			: undefined,

		...props
	},
	ref,
) {
	let effectiveWidth: number | undefined;
	let effectiveHeight: number | undefined;

	if (width !== undefined && height !== undefined) {
		effectiveWidth = width;
		effectiveHeight = height;
	} else if (image) {
		if (width === undefined && height === undefined) {
			effectiveWidth = image.width;
			effectiveHeight = image.height;
		} else {
			const aspectRatio = image.width / image.height;
			if (width !== undefined) {
				effectiveWidth = width;
				effectiveHeight = Math.round(width / aspectRatio);
			} else if (height !== undefined) {
				effectiveWidth = Math.round(height * aspectRatio);
				effectiveHeight = height;
			}
		}
	}

	const shouldOptimize =
		!unoptimized && !src?.startsWith("data:") && effectiveWidth !== undefined;

	if (src) {
		if (!srcSet && shouldOptimize) {
			if (!background && effectiveHeight !== undefined) {
				const placeholderWidth =
					effectiveWidth! > effectiveHeight
						? 16
						: (effectiveWidth! / effectiveHeight) * 16;
				const placeholder = transformUrl(src, placeholderWidth, 25);
				background = `url("${placeholder}") center / cover no-repeat`;
			}

			const maxWidth = Math.max(effectiveWidth!, 8192);
			const usedWidths = new Set(
				[...breakpoints.filter((w) => w < maxWidth), maxWidth].sort(
					(a, b) => a - b,
				),
			);

			srcSet = [...usedWidths]
				.map((w) => `${transformUrl(src!, w, quality)} ${w}w`)
				.join(", ");

			src = transformUrl(src, maxWidth, quality);
		}

		if (sizes === undefined && effectiveWidth !== undefined) {
			switch (layout) {
				case "fullWidth":
					sizes = "100vw";
					break;
				case "constrained":
					sizes = `(min-width: ${effectiveWidth}px) ${effectiveWidth}px, 100vw`;
					break;
				case "fixed":
					sizes = `${effectiveWidth}px`;
					break;
			}
		}

		if (!unstyled) {
			switch (layout) {
				case "fullWidth":
					style = {
						objectFit: "cover",
						width: "100%",
						height: "auto",
						aspectRatio:
							effectiveWidth && effectiveHeight
								? `${effectiveWidth}/${effectiveHeight}`
								: undefined,
						background,
						...style,
					};
					break;
				case "constrained":
					style = {
						objectFit: "cover",
						width: "100%",
						height: "auto",
						maxWidth: effectiveWidth,
						maxHeight: effectiveHeight,
						aspectRatio:
							effectiveWidth && effectiveHeight
								? `${effectiveWidth}/${effectiveHeight}`
								: undefined,
						background,
						...style,
					};
					break;
				case "fixed":
					style = {
						objectFit: "cover",
						width: effectiveWidth,
						height: effectiveHeight,
						background,
						...style,
					};
					break;
			}
		}
	}

	return (
		<img
			{...props}
			src={src}
			width={effectiveWidth}
			height={effectiveHeight}
			srcSet={srcSet}
			style={style}
			// @ts-expect-error: React 18 doesn't have this prop yet
			fetchpriority={fetchPriority}
			loading={loading}
			decoding={decoding}
			sizes={sizes}
			role={role}
			alt={alt}
			ref={ref}
		/>
	);
});

export function createImageUrl(src: string, width: number, quality: number) {
	if (src.startsWith(`/_app/assets/`)) {
		src = src.slice(`/_app/assets/`.length);
	}

	return `/_app/image/${width}/${quality}/${encodeURIComponent(src)}`;
}

// Values stolen from unpic
const DEFAULT_BREAKPOINTS = [
	6016, // 6K
	5120, // 5K
	4480, // 4.5K
	3840, // 4K
	3200, // QHD+
	2560, // WQXGA
	2048, // QXGA
	1920, // 1080p
	1668, // Various iPads
	1280, // 720p
	1080, // iPhone 6-8 Plus
	960, // older horizontal phones
	828, // iPhone XR/11
	750, // iPhone 6-8
	640, // older and lower-end phones
];
