// This is our mockup data store. The data won't persist between server restarts.
// It will also not work when we start supporting serveress functions.

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

let todoItems: TodoItem[] = [
	{
		id: 1,
		text: "Learn React",
		done: true,
	},
	{
		id: 2,
		text: "Learn Rakkas.JS",
		done: false,
	},
];

let nextId = 3;

// Simple CRUD functions

export function readAllTodos() {
	return todoItems;
}

export function createTodo(item: Omit<TodoItem, "id">) {
	todoItems.push({ ...item, id: nextId });
	return nextId++;
}

export function updateTodo(id: number, data: TodoItem) {
	const found = todoItems.find((x) => x.id === id);

	if (found) {
		Object.assign(found, data);
	}

	return found;
}

export function deleteTodo(id: number) {
	todoItems = todoItems.filter((x) => x.id !== id);
}
