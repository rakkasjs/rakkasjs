import React, { FC, ReactNode, useState, useEffect } from "react";
import {
	render,
	Text,
	useFocus,
	useFocusManager,
	useInput,
	Instance,
} from "ink";
import SelectInput from "ink-select-input";
import MultiSelect from "ink-multi-select";
import { Generator } from "./generator";

export interface FormValue {
	packageManager: "npm" | "yarn" | "pnpm";
	features: {
		typescript: boolean;
		jest: boolean;
		eslint: boolean;
		stylelint: boolean;
		prettier: boolean;
	};
}

const FEATURES = [
	{
		value: "typescript" as const,
		label: " TypeScript",
		name: "TypeScript",
	},
	{
		value: "jest" as const,
		label: " Jest for testing",
		name: "Jest",
	},
	{
		value: "eslint" as const,
		label: " ESLint for linting JavaScript/TypeScript",
		name: "ESLint",
	},
	{
		value: "stylelint" as const,
		label: " Stylelint for linting CSS",
		name: "Stylelint",
	},
	{
		value: "prettier" as const,
		label: " Prettier for code formatting",
		name: "Prettier",
	},
];

export interface FormOptions extends Partial<FormValue> {
	yarnAvailable: boolean;
	pnpmAvailable: boolean;
	packageManager?: "npm" | "yarn" | "pnpm";
	typescript?: boolean;
	eslint?: boolean;
	stylelint?: boolean;
	prettier?: boolean;
	noPrompt?: boolean;
}

const Form: FC<FormOptions> = ({
	yarnAvailable,
	pnpmAvailable,
	packageManager,
	noPrompt,
	...opts
}) => {
	const [state, setState] = useState<FormValue>({
		packageManager:
			packageManager ||
			(pnpmAvailable ? "pnpm" : yarnAvailable ? "yarn" : "npm"),
		features: {
			typescript: true,
			jest: true,
			eslint: true,
			stylelint: true,
			prettier: true,
			...opts,
		},
	});
	const [done, setDone] = useState(noPrompt || false);

	useInput((input) => {
		if (input === "q") {
			process.exit();
		}
	});

	const { focusNext } = useFocusManager();

	const packageManagers = [
		{ value: "npm", label: "npm" },
		{
			value: "yarn",
			label: yarnAvailable ? (
				"yarn"
			) : (
				<>
					yarn{" "}
					<Text color="yellow">(warning: could not find yarn on the path)</Text>
				</>
			),
		},
		{
			value: "pnpm",
			label: pnpmAvailable
				? "pnpm"
				: "pnpm (warning: could not find pnpm on the path)",
		},
	].filter(
		(x) =>
			x.value === packageManager ||
			((pnpmAvailable || x.value !== "pnpm") &&
				(yarnAvailable || x.value !== "yarn")),
	);

	useEffect(() => {
		if (packageManagers.length === 1) focusNext();
	}, []);

	return (
		<>
			<Text color="gray">
				Use arrow keys, tab, shift+tab, space, and enter to use the menu. Press
				q to quit.
			</Text>

			<Text />

			<Field
				active={!done}
				label="Package manager"
				value={state.packageManager}
			>
				{packageManagers.length > 1 ? (
					<SelectInput
						items={
							// This is needed to force a nested <Text /> in the label
							packageManagers as any
						}
						initialIndex={packageManagers.findIndex(
							(x) => x.value === state.packageManager,
						)}
						onSelect={(e) => {
							setState((old) => ({
								...old,
								packageManager: e.value as FormValue["packageManager"],
							}));
							focusNext();
						}}
					/>
				) : (
					<Text color="gray">No other package manager detected</Text>
				)}
			</Field>

			<Field
				active={!done}
				label="Optional features"
				value={
					Object.keys(state.features)
						.filter((k) => state.features[k as keyof FormValue["features"]])
						.map((k) => FEATURES.find((x) => x.value === k)!.name)
						.join(", ") || "(none selected)"
				}
			>
				<MultiSelect
					items={FEATURES}
					selected={Object.keys(state.features)
						.filter((k) => state.features[k as keyof FormValue["features"]])
						.map((k) => FEATURES.find((f) => f.value === k)!)}
					onSelect={(item) =>
						setState((old) => ({
							...old,
							features: { ...old.features, [item.value]: true },
						}))
					}
					onUnselect={(item) =>
						setState((old) => ({
							...old,
							features: { ...old.features, [item.value]: false },
						}))
					}
					onSubmit={() => {
						focusNext();
					}}
				/>
			</Field>

			{done || (
				<Field
					active={!done}
					label="Generate project"
					value={done ? "confirmed" : "confirm"}
				>
					<Confirm
						onConfirm={() => {
							setDone(true);
						}}
					/>
				</Field>
			)}

			{done && <Generator {...state} />}
		</>
	);
};

interface FieldProps {
	label: ReactNode;
	value: ReactNode;
	active: boolean;
}

const Field: FC<FieldProps> = ({ active, label, value, children }) => {
	return active ? (
		<ActiveField label={label} value={value} children={children} />
	) : (
		<Text>
			{label}: <Text color="blue">{value}</Text>
		</Text>
	);
};

const ActiveField: FC<Omit<FieldProps, "active">> = ({
	label,
	value,
	children,
}) => {
	const { isFocused } = useFocus({ autoFocus: true });

	return (
		<>
			<Text color={isFocused ? "whiteBright" : undefined}>
				{label}: <Text color="blue">{value}</Text>
			</Text>
			{isFocused && children}
		</>
	);
};

interface ConfirmProps {
	onConfirm?(): void;
}

const Confirm: FC<ConfirmProps> = ({ onConfirm }) => {
	useInput((_, key) => {
		if (key.return && onConfirm) onConfirm();
	});

	return (
		<Text color="yellow">
			Press enter to generate or (shift) tab to go back
		</Text>
	);
};

let app: Instance;

export function renderForm(options: FormOptions) {
	app = render(<Form {...options} />);
}

export function unmountForm() {
	app.unmount();
}
