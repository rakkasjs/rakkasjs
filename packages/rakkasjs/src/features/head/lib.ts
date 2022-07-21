export type { HelmetProps as HeadProps } from "react-helmet-async";
import { ComponentType } from "react";
import { Helmet } from "react-helmet-async";

(Helmet as ComponentType).displayName = "Head";

export { Helmet as Head };
