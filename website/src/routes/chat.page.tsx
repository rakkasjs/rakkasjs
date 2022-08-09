import { Redirect, Page } from "rakkasjs";

const Chat: Page = () => <Redirect href="https://discord.gg/2ZxmAqcPWA" />;

export default Chat;

Chat.preload = () => ({
	redirect: { href: "https://discord.gg/2ZxmAqcPWA" },
});
