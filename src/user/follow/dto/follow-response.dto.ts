export class UserPreviewDto {
	id: string;
	username: string | null;
	name: string | null;
	avatarUrl: string | null;
	bio: string | null;
	isVerified: boolean;
}

export class FollowResponseDto {
	message: string;
	follow?: {
		id: string;
		followerId: string;
		followingId: string;
		createdAt: Date;
		following: UserPreviewDto;
	};
}

export class FollowersResponseDto {
	followers: UserPreviewDto[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export class FollowingResponseDto {
	following: UserPreviewDto[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export class FollowStatsDto {
	followersCount: number;
	followingCount: number;
}

export class IsFollowingDto {
	isFollowing: boolean;
}
