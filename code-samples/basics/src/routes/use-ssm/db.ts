const database = {
	userName: "Jane Doe",
};

export function getUserName() {
	return database.userName;
}

export function setUserName(userName: string) {
	database.userName = userName;
}
