export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token?: string;
	message?: string;
	userId?: number;
	username?: string;
}
